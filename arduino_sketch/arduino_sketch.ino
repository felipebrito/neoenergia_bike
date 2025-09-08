/*
 * BikeJJ - Sensores Hall Ultra Otimizados
 * J1: Pino 36 - Sensor Hall
 * J2: Pino 37 - Sensor Hall  
 * J3: Pino 38 - Sensor Hall
 * J4: Pino 39 - Sensor Hall
 * Performance máxima para sensores magnéticos
 */

// Configurações dos sensores Hall - ULTRA OTIMIZADO
const int HALL_PINS[4] = {36, 37, 38, 39}; // J1, J2, J3, J4
const int DEBOUNCE_DELAY = 0; // ZERO debounce para máxima velocidade

// Contadores para cada jogador
int pedalCount[4] = {0, 0, 0, 0};
int currentReadings[4] = {0, 0, 0, 0};
const int READINGS_PER_PEDAL = 4; // 4 leituras = 1 pedalada (otimizado para 10 pedaladas/seg)

// Estados para cada jogador
bool lastState[4] = {HIGH, HIGH, HIGH, HIGH};
bool currentState[4] = {HIGH, HIGH, HIGH, HIGH};
unsigned long lastDebounceTime[4] = {0, 0, 0, 0};

// Timing
unsigned long lastPedalTime[4] = {0, 0, 0, 0};
unsigned long lastSecondTime = 0;
int readingsPerSecond[4] = {0, 0, 0, 0};

// Detecção de perda de dados
const unsigned long MAX_PEDAL_INTERVAL = 2000; // 2 segundos
bool dataLossDetected[4] = {false, false, false, false};
int lostPedals[4] = {0, 0, 0, 0};

void setup() {
  Serial.begin(115200);
  
  // Configurar pinos dos sensores Hall para todos os jogadores
  for (int i = 0; i < 4; i++) {
    pinMode(HALL_PINS[i], INPUT_PULLUP);
  }
  
  // Aguardar estabilização
  delay(500);
  
  lastSecondTime = millis();
}

void loop() {
  unsigned long currentTime = millis();
  
  // Processar todos os 4 jogadores
  for (int player = 0; player < 4; player++) {
    // Ler estado do sensor Hall do jogador
    int reading = digitalRead(HALL_PINS[player]);
    
    // Processamento ULTRA OTIMIZADO - ZERO debounce
    if (reading != currentState[player]) {
      currentState[player] = reading;
      
      // Sensor Hall ativado (LOW = campo magnético detectado)
      if (currentState[player] == LOW) {
        currentReadings[player]++;
        readingsPerSecond[player]++;
        
        // Mostrar leitura parcial apenas a cada 4 leituras para máxima performance
        if (currentReadings[player] % 4 == 0) {
          Serial.print("📊 J");
          Serial.print(player + 1);
          Serial.print(": Leitura ");
          Serial.print(currentReadings[player]);
          Serial.print("/");
          Serial.print(READINGS_PER_PEDAL);
          Serial.println(" (parcial)");
        }
        
        // Verificar se completou uma pedalada
        if (currentReadings[player] >= READINGS_PER_PEDAL) {
          pedalCount[player]++;
          currentReadings[player] = 0;
          
          // Atualizar tempo da última pedalada
          lastPedalTime[player] = currentTime;
          
          // Resetar flag de perda de dados
          if (dataLossDetected[player]) {
            dataLossDetected[player] = false;
            lostPedals[player] = 0;
          }
          
          // Enviar pedalada completa no formato esperado pelo servidor
          Serial.print("🔍 J");
          Serial.print(player + 1);
          Serial.print(":");
          Serial.println(pedalCount[player]);
        }
      }
    }
    
    lastState[player] = reading;
    
    // Detectar perda de dados em alta velocidade (otimizado para 10 pedaladas/seg)
    if (lastPedalTime[player] > 0 && (currentTime - lastPedalTime[player]) > 1000) { // 1 segundo timeout
      if (!dataLossDetected[player]) {
        dataLossDetected[player] = true;
        lostPedals[player] = 0;
      }
      
      // Estimar pedaladas perdidas baseado na velocidade (40 leituras/seg = 10 pedaladas/seg)
      if (readingsPerSecond[player] > 40) {
        lostPedals[player]++;
      }
    }
  }
  
  // Atualizar contadores a cada segundo (otimizado)
  if (currentTime - lastSecondTime >= 1000) {
    lastSecondTime = currentTime;
    
    // Mostrar estatísticas para jogadores ativos
    for (int player = 0; player < 4; player++) {
      if (pedalCount[player] > 0) {
        Serial.print("📈 J");
        Serial.print(player + 1);
        Serial.print(": ");
        Serial.print(pedalCount[player]);
        Serial.println(" pedaladas total");
      }
      readingsPerSecond[player] = 0;
    }
  }
}
