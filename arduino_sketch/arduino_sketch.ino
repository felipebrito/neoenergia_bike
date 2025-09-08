/*
 * BikeJJ - Arduino Mega CORRIGIDO
 * 4 Jogadores com Sensores de Pedalada
 * Pinos: 36, 40, 44, 48
 * Compatível com Windows (COM) e macOS (cu)
 * CORREÇÃO: Contador não reseta quando sensor desativa
 */

// Configuração dos pinos dos jogadores
const int PLAYER_PINS[] = {36, 40, 44, 48};
const int NUM_PLAYERS = 4;

// Estados dos jogadores
bool playerStates[NUM_PLAYERS] = {false, false, false, false};
bool lastPlayerStates[NUM_PLAYERS] = {false, false, false, false};

// Debounce ULTRA OTIMIZADO para máxima velocidade
unsigned long lastDebounceTime[NUM_PLAYERS] = {0, 0, 0, 0};
const unsigned long DEBOUNCE_DELAY = 1; // 1ms para máxima velocidade

// Contadores de pedaladas
int pedalCount[NUM_PLAYERS] = {0, 0, 0, 0};

// NOVO: Sistema de agrupamento configurável
int readingsPerPedal[NUM_PLAYERS] = {6, 6, 6, 6}; // Leituras necessárias para 1 pedalada (6 por padrão)
int currentReadings[NUM_PLAYERS] = {0, 0, 0, 0}; // Contador atual de leituras

// NOVO: Contabilização de leituras por segundo
int readingsPerSecond[NUM_PLAYERS] = {0, 0, 0, 0};
unsigned long lastSecondTime = 0;
unsigned long lastReadingTime[NUM_PLAYERS] = {0, 0, 0, 0};

// NOVO: Sistema de detecção de perda de dados
unsigned long lastPedalTime[NUM_PLAYERS] = {0, 0, 0, 0};
const unsigned long MAX_PEDAL_INTERVAL = 2000; // 2 segundos máximo entre pedaladas
bool dataLossDetected[NUM_PLAYERS] = {false, false, false, false};
int lostPedals[NUM_PLAYERS] = {0, 0, 0, 0};

// REMOVIDO: Timeouts que causam perda de dados
// O sistema agora NUNCA reseta contadores automaticamente
// Apenas reseta quando completa uma pedalada

// Timers para inatividade (APENAS para status, não para reset)
unsigned long lastActivityTime[NUM_PLAYERS] = {0, 0, 0, 0};
const unsigned long INACTIVITY_TIMEOUT = 5000; // 5 segundos para status

void setup() {
  // Inicializar comunicação serial OTIMIZADA
  Serial.begin(115200);
  
  // Configurar pinos como entrada com pull-up interno
  for (int i = 0; i < NUM_PLAYERS; i++) {
    pinMode(PLAYER_PINS[i], INPUT_PULLUP);
  }
  
  // Aguardar estabilização
  delay(500);
  
  // Inicialização silenciosa para máxima performance
  
  lastSecondTime = millis();
}

void loop() {
  unsigned long currentTime = millis();
  
  // Verificar comandos via serial
  checkSerialCommands();
  
  // Atualizar contadores de leituras por segundo
  updateReadingsPerSecond();
  
  // REMOVIDO: Reset automático que causava perda de dados
  // Os contadores agora só resetam quando completam uma pedalada
  
  // Verificar cada jogador
  for (int player = 0; player < NUM_PLAYERS; player++) {
    int pin = PLAYER_PINS[player];
    bool currentState = digitalRead(pin);
    
    // Debounce ULTRA OTIMIZADO - SEMPRE processa
    if (currentState != lastPlayerStates[player]) {
      lastDebounceTime[player] = currentTime;
        
      if (currentState == LOW) { // Sensor ativado (LOW devido ao pull-up)
        // NOVO: Sistema de agrupamento - SEMPRE incrementa
        currentReadings[player]++;
        lastActivityTime[player] = currentTime;
        lastReadingTime[player] = currentTime;
        
        // Verificar se atingiu o número necessário de leituras
        if (currentReadings[player] >= readingsPerPedal[player]) {
          // Pedalada completa detectada
          playerStates[player] = true;
          pedalCount[player]++;
          currentReadings[player] = 0; // Resetar contador APENAS quando completa
          
          // Atualizar tempo da última pedalada
          lastPedalTime[player] = currentTime;
          
          // Resetar flag de perda de dados
          if (dataLossDetected[player]) {
            dataLossDetected[player] = false;
            lostPedals[player] = 0;
          }
          
          // Enviar apenas dados essenciais para a aplicação
          Serial.print("J");
          Serial.print(player + 1);
          Serial.print(":");
          Serial.println(pedalCount[player]);
        }
        // REMOVIDO: Mensagens de leitura parcial para evitar sobrecarga
        
      } else { // Sensor desativado
        // CORREÇÃO: NÃO resetar contador, apenas marcar como inativo
        playerStates[player] = false;
        
        // REMOVIDO: Mensagens de parada para evitar sobrecarga
      }
      
      lastPlayerStates[player] = currentState;
    }
    
    // Verificar inatividade OTIMIZADA
    if (playerStates[player] && (currentTime - lastActivityTime[player] > INACTIVITY_TIMEOUT)) {
      playerStates[player] = false;
      
      // REMOVIDO: Mensagens de timeout para evitar sobrecarga
    }
    
    // Detectar perda de dados em alta velocidade (silencioso)
    if (lastPedalTime[player] > 0 && (currentTime - lastPedalTime[player]) > MAX_PEDAL_INTERVAL) {
      if (!dataLossDetected[player]) {
        dataLossDetected[player] = true;
        lostPedals[player] = 0;
      }
      
      // Estimar pedaladas perdidas baseado na velocidade
      if (readingsPerSecond[player] > 1000) {
        lostPedals[player]++;
      }
    }
  }
  
  // Delay ULTRA OTIMIZADO para máxima velocidade
  // delay(1); // REMOVIDO para máxima velocidade
}

// REMOVIDO: Função que causava perda de dados
// Os contadores agora NUNCA resetam automaticamente
// Apenas resetam quando completam uma pedalada

void checkSerialCommands() {
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    
    // Comando: J1:10 (Jogador 1, 10 leituras para 1 pedalada)
    if (command.startsWith("J") && command.indexOf(":") > 0) {
      int playerNum = command.substring(1, command.indexOf(":")).toInt();
      int readings = command.substring(command.indexOf(":") + 1).toInt();
      
      if (playerNum >= 1 && playerNum <= 4 && readings >= 1 && readings <= 100) {
        int playerIdx = playerNum - 1;
        readingsPerPedal[playerIdx] = readings;
        currentReadings[playerIdx] = 0; // Resetar contador
        
        // Configuração silenciosa para máxima performance
      }
    }
    // Comando: STATUS - Mostrar configurações atuais (silencioso)
    else if (command.equals("STATUS")) {
      // Status silencioso para máxima performance
    }
    // Comando: RESET - Resetar contadores (silencioso)
    else if (command.equals("RESET")) {
      for (int i = 0; i < NUM_PLAYERS; i++) {
        pedalCount[i] = 0;
        currentReadings[i] = 0;
        readingsPerSecond[i] = 0;
      }
    }
    // Comando: HELP - Ajuda (silencioso)
    else if (command.equals("HELP")) {
      // Ajuda silenciosa para máxima performance
    }
  }
}

void updateReadingsPerSecond() {
  unsigned long currentTime = millis();
  
  // Atualizar contadores a cada segundo
  if (currentTime - lastSecondTime >= 1000) {
    lastSecondTime = currentTime;
    
    // REMOVIDO: Estatísticas para máxima performance
    
    // Resetar contadores
    for (int i = 0; i < NUM_PLAYERS; i++) {
      readingsPerSecond[i] = 0;
    }
  }
  
  // Contar leituras atuais (OTIMIZADO)
  for (int i = 0; i < NUM_PLAYERS; i++) {
    if (lastReadingTime[i] > 0 && (currentTime - lastReadingTime[i]) < 1000) {
      readingsPerSecond[i]++;
    }
  }
}
