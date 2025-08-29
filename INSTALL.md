# 🚀 BikeJJ - Guia de Instalação

> **Instruções completas para configurar e executar o BikeJJ em seu ambiente**

## 📋 Pré-requisitos

### **💻 Sistema Operacional:**
- **macOS**: 10.14+ (Mojave ou superior)
- **Windows**: 10 ou 11
- **Linux**: Ubuntu 18.04+, Debian 10+, ou similar

### **🐍 Python:**
- **Versão**: Python 3.7 ou superior
- **Verificar**: `python3 --version` ou `python --version`

### **🌐 Navegador:**
- **Chrome**: 80+
- **Firefox**: 75+
- **Safari**: 13+
- **Edge**: 80+

### **🔌 Hardware (Opcional):**
- **Arduino Mega**: Para sensores reais de bicicleta
- **Cabo USB**: Para conectar o Arduino
- **Sensores**: Indutivos ou magnéticos para detectar pedaladas

---

## 🚀 Instalação Rápida

### **1️⃣ Clone o Repositório:**
```bash
git clone https://github.com/felipebrito/neoenergia_bike.git
cd neoenergia_bike
```

### **2️⃣ Crie um Ambiente Virtual:**
```bash
# macOS/Linux
python3 -m venv venv
source venv/bin/activate

# Windows
python -m venv venv
venv\Scripts\activate
```

### **3️⃣ Instale as Dependências:**
```bash
pip install -r requirements.txt
```

### **4️⃣ Execute o Servidor:**
```bash
python3 robust_server.py
```

### **5️⃣ Acesse no Navegador:**
```
http://localhost:9000
```

---

## 🔧 Instalação Detalhada

### **📥 Passo 1: Baixar o Projeto**

#### **Opção A: Git Clone (Recomendado)**
```bash
git clone https://github.com/felipebrito/neoenergia_bike.git
cd neoenergia_bike
```

#### **Opção B: Download ZIP**
1. Acesse: https://github.com/felipebrito/neoenergia_bike
2. Clique em "Code" → "Download ZIP"
3. Extraia o arquivo
4. Abra o terminal na pasta extraída

### **🐍 Passo 2: Configurar Python**

#### **Verificar Instalação:**
```bash
python3 --version
# Deve mostrar Python 3.7 ou superior
```

#### **Instalar Python (se necessário):**

**macOS:**
```bash
# Usando Homebrew
brew install python3

# Ou baixar do site oficial
# https://www.python.org/downloads/macos/
```

**Windows:**
```bash
# Baixar do site oficial
# https://www.python.org/downloads/windows/
# IMPORTANTE: Marcar "Add Python to PATH"
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3 python3-pip python3-venv

# CentOS/RHEL
sudo yum install python3 python3-pip
```

### **🔧 Passo 3: Configurar Ambiente Virtual**

#### **Criar Ambiente:**
```bash
# macOS/Linux
python3 -m venv venv

# Windows
python -m venv venv
```

#### **Ativar Ambiente:**
```bash
# macOS/Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

**Indicador de Ativação:**
```bash
(venv) username@computer:~$
# O (venv) indica que o ambiente está ativo
```

### **📦 Passo 4: Instalar Dependências**

#### **Atualizar pip:**
```bash
pip install --upgrade pip
```

#### **Instalar Dependências:**
```bash
pip install -r requirements.txt
```

#### **Verificar Instalação:**
```bash
pip list
# Deve mostrar pyserial instalado
```

---

## 🔌 Configuração do Arduino (Opcional)

### **📱 Preparar o Arduino:**

#### **1. Conectar Arduino Mega:**
- Conecte o Arduino Mega ao computador via USB
- Aguarde a instalação dos drivers

#### **2. Verificar Conexão:**
```bash
# macOS
ls /dev/cu.*

# Windows
# Verificar no Gerenciador de Dispositivos

# Linux
ls /dev/ttyUSB*
ls /dev/ttyACM*
```

#### **3. Upload do Firmware:**
1. Abra o Arduino IDE
2. Abra o arquivo: `esp32_bike_sensor/esp32_bike_sensor.ino`
3. Selecione a placa: "Arduino Mega or Mega 2560"
4. Selecione a porta correta
5. Clique em "Upload"

#### **4. Verificar Funcionamento:**
- Abra o Monitor Serial no Arduino IDE
- Deve mostrar mensagens de inicialização
- Gire o sensor para ver mensagens de pedalada

---

## 🚀 Executando o BikeJJ

### **🎮 Modo Básico (Teclado):**

#### **1. Iniciar Servidor:**
```bash
# Certifique-se de que o ambiente virtual está ativo
(venv) python3 robust_server.py
```

#### **2. Acessar Interface:**
- Abra o navegador
- Acesse: `http://localhost:9000`
- Use as teclas Q, W, E, R para pedalar

### **🔌 Modo Completo (Com Arduino):**

#### **1. Conectar Arduino:**
- Conecte o Arduino Mega via USB
- Verifique se está sendo reconhecido

#### **2. Iniciar Servidor:**
```bash
(venv) python3 robust_server.py
```

#### **3. Conectar Arduino:**
- Na interface web, clique em "Conectar Arduino"
- Aguarde a mensagem de conexão bem-sucedida

#### **4. Testar Sensores:**
- Gire os sensores de bicicleta
- Observe as barras de energia respondendo
- Verifique os logs no terminal

---

## 🐛 Solução de Problemas

### **❌ Erro: "Port already in use"**
```bash
# Encontrar processo usando a porta 9000
lsof -i :9000

# Encerrar processo
kill -9 <PID>
```

### **❌ Erro: "ModuleNotFoundError: No module named 'serial'**
```bash
# Reativar ambiente virtual
source venv/bin/activate

# Reinstalar dependências
pip install -r requirements.txt
```

### **❌ Arduino não é reconhecido:**
1. **Verificar cabo USB**
2. **Testar em outra porta USB**
3. **Reinstalar drivers**
4. **Verificar no Gerenciador de Dispositivos (Windows)**

### **❌ Sensores não respondem:**
1. **Verificar conexões elétricas**
2. **Ajustar distância do sensor**
3. **Verificar alimentação**
4. **Testar no Arduino IDE primeiro**

### **❌ Animações lentas:**
1. **Verificar performance do navegador**
2. **Fechar outras abas**
3. **Reiniciar navegador**
4. **Verificar se GSAP está carregando**

---

## 🔧 Configurações Avançadas

### **⚙️ Personalizar Porta do Servidor:**
```python
# Em robust_server.py, linha ~200
PORT = 9000  # Alterar para porta desejada
```

### **🔌 Configurar Porta Serial Manualmente:**
```python
# Em robust_server.py, comentar auto-detecção
# SERIAL_PORT = '/dev/cu.usbserial-XXXX'  # macOS
# SERIAL_PORT = 'COM3'                     # Windows
# SERIAL_PORT = '/dev/ttyUSB0'             # Linux
```

### **🎮 Ajustar Configurações do Jogo:**
- Acesse: `http://localhost:9000`
- Clique em "⚙️ Configurações"
- Ajuste taxas de energia e decaimento
- Clique em "💾 Salvar"

---

## 📱 Testando em Diferentes Dispositivos

### **💻 Desktop:**
- **Navegador**: Chrome, Firefox, Safari, Edge
- **Resolução**: 1920x1080 ou superior
- **Performance**: Excelente

### **📱 Tablet:**
- **Navegador**: Safari (iOS), Chrome (Android)
- **Resolução**: 1024x768 ou superior
- **Performance**: Boa

### **📱 Mobile:**
- **Navegador**: Chrome, Safari
- **Resolução**: 375x667 ou superior
- **Performance**: Limitada (não recomendado)

---

## 🎯 Próximos Passos

### **🚀 Após Instalação:**
1. **Teste o jogo** com teclado
2. **Conecte o Arduino** (se disponível)
3. **Ajuste configurações** conforme preferência
4. **Explore o dashboard** de relatórios
5. **Personalize** cores e efeitos

### **🔧 Desenvolvimento:**
1. **Fork o repositório**
2. **Crie uma branch** para suas melhorias
3. **Teste localmente**
4. **Abra um Pull Request**

---

## 📞 Suporte

### **🐛 Reportar Bugs:**
- Abra uma **Issue** no GitHub
- Inclua detalhes do sistema operacional
- Adicione logs de erro
- Descreva passos para reproduzir

### **💬 Discussões:**
- Use **Discussions** para ideias
- Compartilhe experiências
- Peça ajuda da comunidade

### **📧 Contato Direto:**
- **GitHub**: [@felipebrito](https://github.com/felipebrito)
- **Repositório**: [neoenergia_bike](https://github.com/felipebrito/neoenergia_bike.git)

---

## 🎉 **Parabéns! Você instalou o BikeJJ com sucesso!** 🚴⚡

> **Agora é só conectar os sensores e começar a competir!**

---

*Última atualização: Agosto 2025*
*Versão: 3.0.0 - Arduino Mega + GSAP + Reset Robusto*
