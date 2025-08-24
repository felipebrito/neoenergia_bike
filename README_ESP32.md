# 🚴 BikeJJ + ESP32 - Sistema de Sensores Indutivos

## 📋 Visão Geral

Este sistema permite que a ESP32 com 4 sensores indutivos controle o jogo BikeJJ através de comunicação serial, simulando as teclas do teclado.

## 🔧 Componentes

### 1. **ESP32 Simulator** (`esp32_simulator.py`)
- Simula a ESP32 enviando dados dos sensores
- Formato: `P1:1`, `P2:0`, `P3:1`, `P4:0`
- `P1` = Jogador 1, `1` = Pedalando, `0` = Parado

### 2. **Serial Server** (`serial_server.py`)
- Recebe dados da ESP32 via serial
- Converte em comandos de tecla
- Envia para o servidor HTTP

### 3. **Servidor Principal** (`server.py`)
- Aceita comandos de tecla via `/api/key`
- Processa como se fossem teclas reais

## 🚀 Instalação

```bash
# Instalar dependências
pip install -r requirements.txt

# Ou manualmente
pip install pyserial urllib3
```

## 🎮 Como Usar

### 1. **Iniciar o Servidor Principal**
```bash
python3 server.py
```

### 2. **Iniciar o Servidor Serial** (em outro terminal)
```bash
python3 serial_server.py
```

### 3. **Testar com Simulador** (opcional)
```bash
python3 esp32_simulator.py
```

## 📡 Formato dos Dados

### **ESP32 → Serial Server**
```
P1:1    # Jogador 1 começou a pedalar
P1:0    # Jogador 1 parou de pedalar
P2:1    # Jogador 2 começou a pedalar
P2:0    # Jogador 2 parou de pedalar
```

### **Serial Server → HTTP Server**
```json
{
    "type": "key_command",
    "player_id": 1,
    "key": "KeyQ",
    "action": "keydown",
    "timestamp": 1234567890.123
}
```

## 🔌 Configuração de Portas

### **Portas Padrão:**
- **HTTP Server**: 8001
- **UDP Server**: 8887
- **Serial**: Primeira porta disponível

### **Configuração ESP32:**
```cpp
// Código ESP32 (exemplo)
void sendSensorData(int playerId, int state) {
    Serial.printf("P%d:%d\n", playerId, state);
}
```

## 🧪 Teste

1. **Inicie o servidor principal**
2. **Inicie o servidor serial**
3. **Conecte a ESP32 ou use o simulador**
4. **Jogue normalmente** - as pedaladas da ESP32 funcionarão como teclas

## 🐛 Troubleshooting

### **Porta Serial não encontrada:**
- Verifique se a ESP32 está conectada
- Use `ls /dev/tty.*` para listar portas
- Ajuste a porta no código se necessário

### **Dados não chegam:**
- Verifique a velocidade serial (baudrate)
- Confirme o formato dos dados
- Verifique os logs do servidor

### **Comandos não funcionam:**
- Verifique se o servidor HTTP está rodando
- Confirme se a porta 8001 está livre
- Verifique os logs de erro

## 🔄 Próximos Passos

- [ ] Implementar simulação real de eventos de tecla
- [ ] Adicionar configuração via interface web
- [ ] Suporte a múltiplas ESP32s
- [ ] Logs detalhados de comunicação
- [ ] Interface de monitoramento em tempo real
