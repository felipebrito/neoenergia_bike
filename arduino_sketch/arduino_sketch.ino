/*
 * BikeJJ - Sensor Hall Ultra Otimizado
 * Pino 36 - Sensor Hall
 * Performance máxima para sensor magnético
 */

// Configurações do sensor Hall - ULTRA OTIMIZADO
const int HALL_PIN = 36;
const int DEBOUNCE_DELAY = 0; // ZERO debounce para máxima velocidade

// Contadores
int pedalCount = 0;
int currentReadings = 0;
const int READINGS_PER_PEDAL = 4; // 4 leituras = 1 pedalada (otimizado para 10 pedaladas/seg)

// Estados
bool lastState = HIGH;
bool currentState = HIGH;
unsigned long lastDebounceTime = 0;

// Timing
unsigned long lastPedalTime = 0;
unsigned long lastSecondTime = 0;
int readingsPerSecond = 0;

// Detecção de perda de dados
const unsigned long MAX_PEDAL_INTERVAL = 2000; // 2 segundos
bool dataLossDetected = false;
int lostPedals = 0;

void setup() {
  Serial.begin(115200);
  
  // Configurar pino do sensor Hall
  pinMode(HALL_PIN, INPUT_PULLUP);
  
  // Aguardar estabilização
  delay(500);
  
  lastSecondTime = millis();
}

void loop() {
  unsigned long currentTime = millis();
  
  // Ler estado do sensor Hall
  int reading = digitalRead(HALL_PIN);
  
  // Processamento ULTRA OTIMIZADO - ZERO debounce
  if (reading != currentState) {
    currentState = reading;
    
    // Sensor Hall ativado (LOW = campo magnético detectado)
    if (currentState == LOW) {
      currentReadings++;
      readingsPerSecond++;
      
      // Mostrar leitura parcial apenas a cada 4 leituras para máxima performance
      if (currentReadings % 4 == 0) {
        Serial.print("📊 J1: Leitura ");
        Serial.print(currentReadings);
        Serial.print("/");
        Serial.print(READINGS_PER_PEDAL);
        Serial.println(" (parcial)");
      }
      
      // Verificar se completou uma pedalada
      if (currentReadings >= READINGS_PER_PEDAL) {
        pedalCount++;
        currentReadings = 0;
        
        // Atualizar tempo da última pedalada
        lastPedalTime = currentTime;
        
        // Resetar flag de perda de dados
        if (dataLossDetected) {
          dataLossDetected = false;
          lostPedals = 0;
        }
        
        // Enviar pedalada completa no formato esperado pelo servidor
        Serial.print("🔍 J1:");
        Serial.println(pedalCount);
      }
    }
  }
  
  lastState = reading;
  
  // Detectar perda de dados em alta velocidade (otimizado para 10 pedaladas/seg)
  if (lastPedalTime > 0 && (currentTime - lastPedalTime) > 1000) { // 1 segundo timeout
    if (!dataLossDetected) {
      dataLossDetected = true;
      lostPedals = 0;
    }
    
    // Estimar pedaladas perdidas baseado na velocidade (40 leituras/seg = 10 pedaladas/seg)
    if (readingsPerSecond > 40) {
      lostPedals++;
    }
  }
  
  // Atualizar contadores a cada segundo (otimizado)
  if (currentTime - lastSecondTime >= 1000) {
    lastSecondTime = currentTime;
    readingsPerSecond = 0;
    
    // Mostrar estatísticas apenas se há atividade
    if (pedalCount > 0) {
      Serial.print("📈 J1: ");
      Serial.print(pedalCount);
      Serial.println(" pedaladas total");
    }
  }
}
