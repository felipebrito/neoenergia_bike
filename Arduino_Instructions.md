# 🚴 Arduino Mega - BikeJJ Setup

## 📋 Materiais Necessários

### Hardware:
- **Arduino Mega 2560** (ou similar)
- **4x Sensores de proximidade/reed switch** (um para cada jogador)
- **Cabos jumper** (macho-macho e macho-fêmea)
- **Cabo USB A-B** (para conectar Arduino ao computador)
- **Protoboard** (opcional, para organizar conexões)
- **Resistores de pull-up 10kΩ** (caso os sensores não tenham pull-up interno)

### Software:
- **Arduino IDE** (versão 1.8.19 ou superior)
- **Python 3.x** com pacote `pyserial`

## 🔌 Conexões dos Sensores

### Pinos do Arduino Mega:
- **Jogador 1**: Pino 36
- **Jogador 2**: Pino 40
- **Jogador 3**: Pino 44
- **Jogador 4**: Pino 48

### Esquema de Conexão:
```
Sensor → Arduino Mega
VCC    → 5V ou 3.3V
GND    → GND
SINAL  → Pino correspondente (36, 40, 44, 48)
```

**Nota**: O código usa `INPUT_PULLUP`, então não são necessários resistores externos se o sensor for do tipo "normalmente aberto".

## 💻 Configuração do Arduino

### 1. Abrir Arduino IDE
- Conecte o Arduino Mega ao computador via USB
- Abra o Arduino IDE

### 2. Configurar Placa e Porta
- **Ferramentas** → **Placa** → **Arduino AVR Boards** → **Arduino Mega or Mega 2560**
- **Ferramentas** → **Porta** → Selecione a porta COM (Windows) ou /dev/cu.* (macOS)

### 3. Carregar o Código
- Abra o arquivo `arduino_mega_bike.ino`
- Clique em **Verificar** (ícone ✓) para compilar
- Clique em **Carregar** (ícone →) para enviar para o Arduino

### 4. Verificar Funcionamento
- Abra o **Monitor Serial** (Ctrl+Shift+M)
- Configure **Baudrate** para **115200**
- Você deve ver mensagens como:
```
🚴 BikeJJ Arduino Mega Iniciado
📡 Pinos configurados: 36, 40, 44, 48
⚡ Baudrate: 115200
==================================================
```

## 🐍 Configuração do Python

### 1. Instalar pyserial
```bash
# No macOS/Linux:
pip3 install pyserial

# No Windows:
pip install pyserial
```

### 2. Testar Comunicação
```bash
# Executar script de teste:
python3 test_arduino_mega.py
```

### 3. Iniciar Servidor do Jogo
```bash
# Executar servidor principal:
python3 server.py
```

## 🔧 Identificação de Portas Seriais

### Windows:
- Abra **Gerenciador de Dispositivos**
- Procure por **Portas (COM & LPT)**
- O Arduino aparecerá como **COM3**, **COM4**, etc.

### macOS:
- Abra **Terminal**
- Execute: `ls /dev/cu.*`
- O Arduino aparecerá como `/dev/cu.usbmodem*` ou `/dev/cu.usbserial*`

### Linux:
- Execute: `ls /dev/tty*`
- O Arduino aparecerá como `/dev/ttyUSB*` ou `/dev/ttyACM*`

## 🎮 Usando o Configurador Serial

1. Inicie o servidor: `python3 server.py`
2. Abra o navegador em: `http://localhost:9000`
3. Clique no botão **🔧 Serial**
4. Selecione a porta correta do Arduino Mega
5. Clique em **Conectar**

## 🔍 Teste e Debugging

### Mensagens Esperadas:
```
🔍 Jogador 1: Pedalada #1 detectada
📨 Jogador 1: Pedalada: True
📊 Jogador 1: Total de pedaladas: 1
📨 Jogador 1: Pedalada: False
🛑 Jogador 1: Inatividade detectada
```

### Problemas Comuns:

#### "Porta não encontrada"
- ✅ Verificar se o Arduino está conectado
- ✅ Verificar se o driver está instalado
- ✅ Testar outra porta USB

#### "Sem permissão na porta"
- **Linux**: `sudo chmod 666 /dev/ttyUSB0`
- **macOS**: Geralmente não há problemas de permissão

#### "Sem mensagens no console"
- ✅ Verificar conexões dos sensores
- ✅ Verificar se o código foi carregado corretamente
- ✅ Verificar baudrate (deve ser 115200)

#### "Mensagens estranhas/ilegíveis"
- ✅ Verificar baudrate no Monitor Serial
- ✅ Verificar se não há problemas de alimentação
- ✅ Verificar cabos USB

## 🚀 Próximos Passos

1. **Teste cada sensor individualmente** simulando pedaladas
2. **Verifique se todas as mensagens aparecem** no console Python
3. **Abra o jogo no navegador** e teste a integração
4. **Configure a velocidade de decaimento** conforme necessário
5. **Ajuste a sensibilidade** dos sensores se necessário

## 📞 Suporte

Se encontrar problemas:
1. Verifique todas as conexões
2. Teste o script `test_arduino_mega.py`
3. Verifique o Monitor Serial do Arduino IDE
4. Use o configurador serial do navegador

Boa sorte com seu projeto BikeJJ! 🚴‍♀️🚴‍♂️
