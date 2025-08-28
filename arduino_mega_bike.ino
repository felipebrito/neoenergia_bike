/*
 * BikeJJ - Arduino Mega
 * 4 Jogadores com Sensores de Pedalada
 * Pinos: 36, 40, 44, 48
 * Compatível com Windows (COM) e macOS (cu)
 */

// Configuração dos pinos dos jogadores
const int PLAYER_PINS[] = {36, 40, 44, 48};
const int NUM_PLAYERS = 4;

// Estados dos jogadores
bool playerStates[NUM_PLAYERS] = {false, false, false, false};
bool lastPlayerStates[NUM_PLAYERS] = {false, false, false, false};

// Debounce para evitar leituras falsas
unsigned long lastDebounceTime[NUM_PLAYERS] = {0, 0, 0, 0};
const unsigned long DEBOUNCE_DELAY = 50; // 50ms

// Contadores de pedaladas
int pedalCount[NUM_PLAYERS] = {0, 0, 0, 0};

// Timers para inatividade
unsigned long lastActivityTime[NUM_PLAYERS] = {0, 0, 0, 0};
const unsigned long INACTIVITY_TIMEOUT = 1000; // 1 segundo

void setup() {
  // Inicializar comunicação serial
  Serial.begin(115200);
  
  // Configurar pinos como entrada com pull-up interno
  for (int i = 0; i < NUM_PLAYERS; i++) {
    pinMode(PLAYER_PINS[i], INPUT_PULLUP);
  }
  
  // Aguardar estabilização
  delay(1000);
  
  Serial.println("🚴 BikeJJ Arduino Mega Iniciado");
  Serial.println("📡 Pinos configurados: 36, 40, 44, 48");
  Serial.println("⚡ Baudrate: 115200");
  Serial.println("==================================================");
}

void loop() {
  unsigned long currentTime = millis();
  
  // Verificar cada jogador
  for (int player = 0; player < NUM_PLAYERS; player++) {
    int pin = PLAYER_PINS[player];
    bool currentState = digitalRead(pin);
    
    // Debounce
    if (currentTime - lastDebounceTime[player] > DEBOUNCE_DELAY) {
      // Mudança de estado detectada
      if (currentState != lastPlayerStates[player]) {
        lastDebounceTime[player] = currentTime;
        
        if (currentState == LOW) { // Sensor ativado (LOW devido ao pull-up)
          // Pedalada detectada
          playerStates[player] = true;
          pedalCount[player]++;
          lastActivityTime[player] = currentTime;
          
          Serial.print("🔍 Jogador ");
          Serial.print(player + 1);
          Serial.print(": Pedalada #");
          Serial.print(pedalCount[player]);
          Serial.println(" detectada");
          
          Serial.print("📨 Jogador ");
          Serial.print(player + 1);
          Serial.print(": Pedalada: True");
          Serial.println();
          
          Serial.print("📊 Jogador ");
          Serial.print(player + 1);
          Serial.print(": Total de pedaladas: ");
          Serial.println(pedalCount[player]);
          
        } else { // Sensor desativado
          // Fim da pedalada
          playerStates[player] = false;
          
          Serial.print("📨 Jogador ");
          Serial.print(player + 1);
          Serial.print(": Pedalada: False");
          Serial.println();
          
          Serial.print("🛑 Jogador ");
          Serial.print(player + 1);
          Serial.print(": Inatividade detectada");
          Serial.println();
        }
        
        lastPlayerStates[player] = currentState;
      }
    }
    
    // Verificar inatividade
    if (playerStates[player] && (currentTime - lastActivityTime[player] > INACTIVITY_TIMEOUT)) {
      playerStates[player] = false;
      
      Serial.print("⏰ Jogador ");
      Serial.print(player + 1);
      Serial.print(": Timeout de inatividade");
      Serial.println();
    }
  }
  
  // Pequeno delay para estabilidade
  delay(10);
}
