# 🚀 BikeJJ - Configuração de Inicialização Automática

## 📁 Arquivos Criados

### 1. **Startup Automático (Windows)**
- **Localização**: `C:\Users\Brito\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\`
- **Arquivos**:
  - `BikeJJ_Startup.bat` - Script batch para inicialização
  - `BikeJJ_Startup.ps1` - Script PowerShell para inicialização

### 2. **Atalho na Área de Trabalho**
- **Localização**: `C:\Users\Brito\Desktop\`
- **Arquivo**: `BikeJJ_Start.bat` - Atalho para inicialização manual

## ⚙️ Como Funciona

### **Inicialização Automática**
1. **Windows inicia** → Aguarda 10 segundos
2. **Navega** para o diretório do projeto
3. **Ativa** ambiente virtual (se existir)
4. **Executa** `python start_bikejj.py`
5. **Sistema** inicia automaticamente

### **Inicialização Manual**
1. **Duplo clique** em `BikeJJ_Start.bat` na área de trabalho
2. **Sistema** inicia imediatamente

## 🔧 Configurações

### **Para Desabilitar Inicialização Automática**
```bash
# Remover arquivos do startup
del "C:\Users\Brito\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\BikeJJ_Startup.bat"
del "C:\Users\Brito\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\BikeJJ_Startup.ps1"
```

### **Para Alterar Diretório do Projeto**
Editar os arquivos e alterar:
```bash
# De:
cd /d "C:\Users\Brito\neoenergia_bike"

# Para:
cd /d "SEU_DIRETORIO_AQUI"
```

## 🎯 Uso no Evento

### **Preparação**
1. **Conectar Arduino** via USB
2. **Conectar sensores** nos pinos 36, 40, 44, 48
3. **Ligar computador** → Sistema inicia automaticamente

### **Resultado**
- ✅ **Servidor** iniciado automaticamente
- ✅ **Chrome** aberto com layout otimizado
- ✅ **Arduino** detectado e conectado
- ✅ **Jogo** pronto para uso

## 📋 Verificações

### **Se Não Iniciar Automaticamente**
1. Verificar se arquivos estão no diretório startup
2. Verificar se Python está instalado
3. Verificar se projeto está no diretório correto
4. Usar atalho manual na área de trabalho

### **Logs de Erro**
- **Terminal**: Mostra erros em tempo real
- **Arquivo**: `serial_config.json` para configurações
- **Navegador**: Console F12 para debug

## 🚨 Solução de Problemas

### **"Diretório não encontrado"**
```bash
# Verificar se projeto está em:
C:\Users\Brito\neoenergia_bike

# Se não estiver, mover projeto ou alterar caminho nos scripts
```

### **"Python não encontrado"**
```bash
# Instalar Python 3.8+ do site oficial
https://www.python.org/downloads/

# Ou adicionar Python ao PATH do sistema
```

### **"Arduino não encontrado"**
- Verificar se Arduino está conectado via USB
- Verificar se firmware está carregado
- Usar configurador serial: `http://localhost:9000/serial_config.html`

## 📞 Suporte

### **Comandos Úteis**
```bash
# Verificar se arquivos de startup existem
dir "C:\Users\Brito\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\"

# Testar inicialização manual
C:\Users\Brito\Desktop\BikeJJ_Start.bat

# Verificar status do sistema
python start_bikejj.py
```

---

**🎯 Sistema configurado para inicialização automática!** 🚴‍♂️🏆
