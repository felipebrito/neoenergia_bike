# 🚴 BikeJJ - Guia de Inicialização

## 🚀 Inicialização Rápida

### Método 1: Script Automático (Recomendado)
```bash
# Windows
start_bikejj.bat

# Linux/Mac
python start_bikejj.py
```

### Método 2: Manual
```bash
# 1. Ativar ambiente virtual (se existir)
venv\Scripts\activate

# 2. Iniciar servidor
python server.py

# 3. Abrir navegador
http://localhost:9000
```

## 🔧 Funcionalidades do Script Automático

### ✅ Verificações Automáticas
- **Python instalado**: Verifica se Python 3.8+ está disponível
- **Arquivos necessários**: Confirma que `server.py` existe
- **Ambiente virtual**: Ativa automaticamente se existir
- **Google Chrome**: Localiza e usa Chrome se disponível

### 🔌 Detecção de Arduino
- **Porta configurada**: Testa se a porta salva funciona
- **Busca automática**: Procura Arduino em todas as portas COM
- **Teste de conexão**: Verifica se Arduino responde com dados
- **Configuração automática**: Salva porta que funciona

### 🌐 Interface Otimizada
- **Chrome posicionado**: Lado direito da tela (Windows + Seta direita)
- **Zoom 50%**: Interface otimizada para visualização
- **Configurador automático**: Abre se Arduino não for encontrado

## 📋 Requisitos

### Sistema
- **Windows 10/11** (recomendado)
- **Python 3.8+** instalado
- **Google Chrome** (opcional, mas recomendado)

### Hardware
- **Arduino Mega** com firmware BikeJJ
- **Sensores Hall** conectados nos pinos 36, 40, 44, 48
- **Cabo USB** para conexão

## 🎯 Fluxo de Inicialização

1. **Verificação inicial**
   - Python instalado ✓
   - Arquivos do projeto ✓
   - Ambiente virtual ✓

2. **Detecção de Arduino**
   - Carrega configuração salva
   - Testa conexão com Arduino
   - Se falhar, busca automaticamente
   - Salva porta que funciona

3. **Inicialização do servidor**
   - Inicia `server.py` em background
   - Aguarda servidor ficar pronto
   - Verifica se está rodando

4. **Interface do usuário**
   - Abre Chrome com layout otimizado
   - Posiciona no lado direito
   - Aplica zoom 50%
   - Abre configurador se necessário

## 🔧 Solução de Problemas

### ❌ "Python não encontrado"
```bash
# Instalar Python 3.8+ do site oficial
https://www.python.org/downloads/
```

### ❌ "Arduino não encontrado"
1. Verificar se Arduino está conectado via USB
2. Verificar se firmware está carregado
3. Usar configurador serial: `http://localhost:9000/serial_config.html`

### ❌ "Chrome não encontrado"
- O script usará navegador padrão
- Para melhor experiência, instale Google Chrome

### ❌ "Servidor não inicia"
1. Verificar se porta 9000 está livre
2. Fechar outros programas que usam a porta
3. Executar como administrador

## 📁 Arquivos do Sistema

```
neoenergia_bike/
├── start_bikejj.py      # Script principal de inicialização
├── start_bikejj.bat     # Arquivo batch para Windows
├── server.py            # Servidor principal
├── arduino_sketch/      # Firmware do Arduino
│   └── arduino_sketch.ino
├── serial_config.json   # Configuração da porta serial
├── game_config.json     # Configurações do jogo
└── INICIALIZACAO.md     # Este arquivo
```

## 🎮 Uso no Evento

### Preparação
1. **Conectar Arduino** via USB
2. **Conectar sensores** nos pinos corretos
3. **Executar** `start_bikejj.bat`
4. **Aguardar** inicialização automática

### Durante o Evento
- **Chrome** abrirá automaticamente
- **Jogo** estará pronto para uso
- **Configurações** podem ser ajustadas
- **Monitoramento** em tempo real

## 📞 Suporte

### Logs do Sistema
- **Terminal**: Mostra status em tempo real
- **Arquivo**: `serial_config.json` para configurações
- **Navegador**: Console F12 para debug

### Comandos Úteis
```bash
# Verificar portas COM
python -c "import serial.tools.list_ports; [print(p.device) for p in serial.tools.list_ports.comports()]"

# Testar conexão Arduino
python -c "import serial; ser = serial.Serial('COM6', 115200); print(ser.readline().decode())"

# Verificar servidor
curl http://localhost:9000/api/state
```

---

**🎯 Sistema pronto para o evento!** 🚴‍♂️🏆
