/*
 * BikeJJ - Arduino Mega OTIMIZADO
 * 4 Jogadores com Sensores de Pedalada
 * Pinos: 36, 40, 44, 48
 * Compatível com Windows (COM) e macOS (cu)
 * OTIMIZAÇÕES: Debounce reduzido, mensagens simplificadas, processamento mais rápido
 * NOVO: Contabilização de leituras/segundo e agrupamento configurável
 */

// Configuração dos pinos dos jogadores
const int PLAYER_PINS[] = {36, 40, 44, 48};
const int NUM_PLAYERS = 4;

// Estados dos jogadores
bool playerStates[NUM_PLAYERS] = {false, false, false, false};
bool lastPlayerStates[NUM_PLAYERS] = {false, false, false, false};

// Debounce OTIMIZADO para capturar pedaladas rápidas
unsigned long lastDebounceTime[NUM_PLAYERS] = {0, 0, 0, 0};
const unsigned long DEBOUNCE_DELAY = 15; // 15ms (reduzido de 50ms)

// Contadores de pedaladas
int pedalCount[NUM_PLAYERS] = {0, 0, 0, 0};

// NOVO: Sistema de agrupamento configurável
int readingsPerPedal[NUM_PLAYERS] = {6, 6, 6, 6}; // Leituras necessárias para 1 pedalada (6 por padrão)
int currentReadings[NUM_PLAYERS] = {0, 0, 0, 0}; // Contador atual de leituras

// NOVO: Contabilização de leituras por segundo
int readingsPerSecond[NUM_PLAYERS] = {0, 0, 0, 0};
unsigned long lastSecondTime = 0;
unsigned long lastReadingTime[NUM_PLAYERS] = {0, 0, 0, 0};

// Timers para inatividade
unsigned long lastActivityTime[NUM_PLAYERS] = {0, 0, 0, 0};
const unsigned long INACTIVITY_TIMEOUT = 800; // 800ms (reduzido de 1000ms)

// Buffer para otimizar envio serial
String serialBuffer = "";

void setup() {
  // Inicializar comunicação serial OTIMIZADA
  Serial.begin(115200);
  
  // Configurar pinos como entrada com pull-up interno
  for (int i = 0; i < NUM_PLAYERS; i++) {
    pinMode(PLAYER_PINS[i], INPUT_PULLUP);
  }
  
  // Aguardar estabilização
  delay(500); // Reduzido de 1000ms
  
  Serial.println("🚴 BikeJJ Arduino Mega OTIMIZADO Iniciado");
  Serial.println("📡 Pinos configurados: 36, 40, 44, 48");
  Serial.println("⚡ Baudrate: 115200");
  Serial.println("🔧 OTIMIZAÇÕES: Debounce 15ms, Processamento rápido");
  Serial.println("📊 NOVO: Contabilização de leituras/segundo");
  Serial.println("⚙️ NOVO: Agrupamento configurável via serial");
  Serial.println("💡 Comandos: 'J1:10' = Jogador 1 precisa de 10 leituras para 1 pedalada");
  Serial.println("⚙️ PADRÃO: 6 leituras = 1 pedalada para todos os jogadores");
  Serial.println("==================================================");
  
  lastSecondTime = millis();
}

void loop() {
  unsigned long currentTime = millis();
  
  // Verificar comandos via serial
  checkSerialCommands();
  
  // Atualizar contadores de leituras por segundo
  updateReadingsPerSecond();
  
  // Verificar cada jogador
  for (int player = 0; player < NUM_PLAYERS; player++) {
    int pin = PLAYER_PINS[player];
    bool currentState = digitalRead(pin);
    
    // Debounce OTIMIZADO
    if (currentTime - lastDebounceTime[player] > DEBOUNCE_DELAY) {
      // Mudança de estado detectada
      if (currentState != lastPlayerStates[player]) {
        lastDebounceTime[player] = currentTime;
        
        if (currentState == LOW) { // Sensor ativado (LOW devido ao pull-up)
          // NOVO: Sistema de agrupamento
          currentReadings[player]++;
          lastActivityTime[player] = currentTime;
          lastReadingTime[player] = currentTime;
          
          // Verificar se atingiu o número necessário de leituras
          if (currentReadings[player] >= readingsPerPedal[player]) {
            // Pedalada completa detectada
            playerStates[player] = true;
            pedalCount[player]++;
            currentReadings[player] = 0; // Resetar contador
            
            // Enviar mensagem de pedalada completa
            Serial.print("🔍 Jogador ");
            Serial.print(player + 1);
            Serial.print(": Pedalada #");
            Serial.print(pedalCount[player]);
            Serial.print(" detectada (");
            Serial.print(readingsPerPedal[player]);
            Serial.println(" leituras)");
          } else {
            // Apenas leitura parcial
            Serial.print("📊 Jogador ");
            Serial.print(player + 1);
            Serial.print(": Leitura ");
            Serial.print(currentReadings[player]);
            Serial.print("/");
            Serial.print(readingsPerPedal[player]);
            Serial.println(" (parcial)");
          }
          
        } else { // Sensor desativado
          // Fim da pedalada - MENSAGEM SIMPLIFICADA
          playerStates[player] = false;
          
          // Enviar apenas 1 mensagem de parada
          Serial.print("📨 Jogador ");
          Serial.print(player + 1);
          Serial.print(": Pedalada: False");
          Serial.println();
        }
        
        lastPlayerStates[player] = currentState;
      }
    }
    
    // Verificar inatividade OTIMIZADA
    if (playerStates[player] && (currentTime - lastActivityTime[player] > INACTIVITY_TIMEOUT)) {
      playerStates[player] = false;
      
      Serial.print("⏰ Jogador ");
      Serial.print(player + 1);
      Serial.print(": Timeout de inatividade");
      Serial.println();
    }
  }
  
  // Delay OTIMIZADO para máxima responsividade
  delay(2); // Reduzido de 10ms para 2ms
}

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
        
        Serial.print("⚙️ Jogador ");
        Serial.print(playerNum);
        Serial.print(": Configurado para ");
        Serial.print(readings);
        Serial.println(" leituras por pedalada");
      } else {
        Serial.println("❌ Comando inválido. Use: J1:10 (Jogador 1-4, Leituras 1-100)");
      }
    }
    // Comando: STATUS - Mostrar configurações atuais
    else if (command.equals("STATUS")) {
      Serial.println("📊 STATUS ATUAL:");
      for (int i = 0; i < NUM_PLAYERS; i++) {
        Serial.print("   Jogador ");
        Serial.print(i + 1);
        Serial.print(": ");
        Serial.print(readingsPerPedal[i]);
        Serial.print(" leituras/pedalada, ");
        Serial.print(readingsPerSecond[i]);
        Serial.println(" leituras/segundo");
      }
    }
    // Comando: RESET - Resetar contadores
    else if (command.equals("RESET")) {
      for (int i = 0; i < NUM_PLAYERS; i++) {
        pedalCount[i] = 0;
        currentReadings[i] = 0;
        readingsPerSecond[i] = 0;
      }
      Serial.println("🔄 Contadores resetados");
    }
    // Comando: HELP - Ajuda
    else if (command.equals("HELP")) {
      Serial.println("💡 COMANDOS DISPONÍVEIS:");
      Serial.println("   J1:10 - Jogador 1 precisa de 10 leituras para 1 pedalada");
      Serial.println("   J2:5  - Jogador 2 precisa de 5 leituras para 1 pedalada");
      Serial.println("   STATUS - Mostrar configurações atuais");
      Serial.println("   RESET - Resetar todos os contadores");
      Serial.println("   HELP - Mostrar esta ajuda");
      Serial.println("⚙️ PADRÃO: 6 leituras = 1 pedalada (configurável)");
    }
    else {
      Serial.println("❌ Comando não reconhecido. Digite HELP para ver comandos disponíveis.");
    }
  }
}

void updateReadingsPerSecond() {
  unsigned long currentTime = millis();
  
  // Atualizar contadores a cada segundo
  if (currentTime - lastSecondTime >= 1000) {
    lastSecondTime = currentTime;
    
    // Mostrar estatísticas de leituras por segundo
    Serial.print("📈 Leituras/segundo: ");
    for (int i = 0; i < NUM_PLAYERS; i++) {
      Serial.print("J");
      Serial.print(i + 1);
      Serial.print(":");
      Serial.print(readingsPerSecond[i]);
      if (i < NUM_PLAYERS - 1) Serial.print(", ");
    }
    Serial.println();
    
    // Resetar contadores
    for (int i = 0; i < NUM_PLAYERS; i++) {
      readingsPerSecond[i] = 0;
    }
  }
  
  // Contar leituras atuais
  for (int i = 0; i < NUM_PLAYERS; i++) {
    if (lastReadingTime[i] > 0 && (currentTime - lastReadingTime[i]) < 1000) {
      readingsPerSecond[i]++;
    }
  }
}