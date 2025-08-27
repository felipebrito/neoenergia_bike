#include <Arduino.h>

// Configurações do sensor
#define SENSOR_PIN 16
#define DEBOUNCE_TIME 100  // Tempo mínimo entre leituras (ms) - AUMENTADO
#define PEDAL_INACTIVITY_TIMEOUT 2000 // Tempo sem pedal para enviar "Pedalada: False" (ms)
#define MESSAGE_DEBOUNCE_TIME 500 // Tempo mínimo entre mensagens de pedalada (ms) - NOVO

// Variáveis de estado
volatile bool lastSensorState = false;
volatile unsigned long lastDebounceTime = 0;
volatile int pedalCount = 0;
volatile unsigned long lastPedalEventTime = 0; // Timestamp da última detecção de pedal (HIGH)
volatile bool lastPedalState = false; // Estado da última pedalada enviada
volatile unsigned long lastMessageTime = 0; // Timestamp da última mensagem enviada - NOVO

// Função de interrupção para resposta imediata
void IRAM_ATTR handleSensorInterrupt() {
  unsigned long currentTime = millis();
  
  if (currentTime - lastDebounceTime > DEBOUNCE_TIME) {
    bool currentState = digitalRead(SENSOR_PIN);
    
    if (currentState != lastSensorState) {
      lastDebounceTime = currentTime;
      lastSensorState = currentState;
      
      if (currentState == HIGH) {  // Pedalada detectada (sensor ativado)
        pedalCount++;
        lastPedalEventTime = currentTime; // Registrar o tempo da última pedalada
        Serial.printf("🔍 Interrupção: Sensor HIGH - Pedalada #%d\n", pedalCount);
      }
    }
  }
}

void setup() {
  Serial.begin(115200);
  
  // Configurar pino do sensor
  pinMode(SENSOR_PIN, INPUT_PULLUP);
  
  // Configurar interrupção para resposta rápida
  attachInterrupt(digitalPinToInterrupt(SENSOR_PIN), handleSensorInterrupt, CHANGE);
  
  // Aguardar estabilização
  delay(100);
  
  Serial.println("🚴 ESP32 BikeJJ Sensor - Iniciado!");
  Serial.println("Sensor conectado no pino D16");
  Serial.println("Formato: Pedaladas: X | Pedalada: True/False");
}

void loop() {
  unsigned long currentTime = millis();

  // 1. Enviar "Pedalada: True" se houver uma nova pedalada E se passou tempo suficiente desde a última mensagem
  if (lastPedalEventTime > 0 && !lastPedalState && (currentTime - lastMessageTime > MESSAGE_DEBOUNCE_TIME)) {
    Serial.printf("Pedaladas: %d\n", pedalCount);
    Serial.printf("Pedalada: True\n");
    lastPedalState = true; // Marcar que enviamos True
    lastMessageTime = currentTime; // Registrar tempo da mensagem
    Serial.printf("✅ Pedalada #%d enviada (True)\n", pedalCount);
  }

  // 2. Enviar "Pedalada: False" se não houver pedaladas por um tempo
  // E se a última pedalada enviada foi "True" (para evitar spam de False)
  if (lastPedalState && (currentTime - lastPedalEventTime > PEDAL_INACTIVITY_TIMEOUT)) {
    Serial.printf("Pedaladas: %d\n", pedalCount);
    Serial.printf("Pedalada: False\n");
    lastPedalState = false; // Marcar que enviamos False
    Serial.printf("🛑 Inatividade: Pedalada: False enviada\n");
  }
  
  delay(100);  // Delay para estabilidade
}
