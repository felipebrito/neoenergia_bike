#!/usr/bin/env python3
"""
BikeJJ - Script de Inicialização Automática
Verifica conexão Arduino, inicia servidor e abre Chrome
"""

import subprocess
import time
import json
import os
import sys
import serial
import serial.tools.list_ports
import webbrowser
import threading
from pathlib import Path

# Configurações
CONFIG_FILE = 'serial_config.json'
GAME_URL = 'http://localhost:9000'
CONFIG_URL = 'http://localhost:9000/serial_config.html'
CHROME_PATH = None
SERIAL_BAUDRATE = 115200

def find_chrome():
    """Encontrar o executável do Chrome"""
    global CHROME_PATH
    
    # Caminhos possíveis do Chrome no Windows
    chrome_paths = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        r"C:\Users\{}\AppData\Local\Google\Chrome\Application\chrome.exe".format(os.getenv('USERNAME')),
        r"C:\Users\{}\AppData\Local\Google\Chrome\Application\chrome.exe".format(os.getenv('USER')),
    ]
    
    for path in chrome_paths:
        if os.path.exists(path):
            CHROME_PATH = path
            return path
    
    # Tentar encontrar via registro do Windows
    try:
        import winreg
        key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe")
        chrome_path, _ = winreg.QueryValueEx(key, "")
        winreg.CloseKey(key)
        if os.path.exists(chrome_path):
            CHROME_PATH = chrome_path
            return chrome_path
    except:
        pass
    
    return None

def get_available_ports():
    """Obter portas COM disponíveis"""
    ports = []
    try:
        for port in serial.tools.list_ports.comports():
            if port.device.startswith('COM'):
                ports.append({
                    'device': port.device,
                    'description': port.description,
                    'manufacturer': getattr(port, 'manufacturer', 'N/A')
                })
    except Exception as e:
        print(f"❌ Erro ao listar portas: {e}")
    return ports

def test_arduino_connection(port, timeout=5):
    """Testar conexão com Arduino"""
    try:
        print(f"🔌 Testando conexão com {port}...")
        ser = serial.Serial(port, SERIAL_BAUDRATE, timeout=timeout)
        time.sleep(3)  # Aguardar inicialização mais tempo
        
        # Tentar ler dados do Arduino
        data_received = False
        start_time = time.time()
        attempts = 0
        
        while time.time() - start_time < timeout and attempts < 10:
            if ser.in_waiting > 0:
                line = ser.readline().decode('utf-8', errors='ignore').strip()
                if line and ('🔍' in line or '📊' in line or '📈' in line or 'J1:' in line or 'J2:' in line or 'J3:' in line or 'J4:' in line):
                    data_received = True
                    print(f"✅ Arduino respondendo: {line[:50]}...")
                    break
            time.sleep(0.2)
            attempts += 1
        
        ser.close()
        return data_received
    except Exception as e:
        print(f"❌ Erro ao testar {port}: {e}")
        return False

def find_arduino_port():
    """Encontrar porta do Arduino automaticamente"""
    print("🔍 Procurando Arduino...")
    ports = get_available_ports()
    
    if not ports:
        print("❌ Nenhuma porta COM encontrada")
        return None
    
    print(f"📡 {len(ports)} porta(s) encontrada(s):")
    for port in ports:
        print(f"   {port['device']} - {port['description']}")
    
    # Testar cada porta
    for port in ports:
        if test_arduino_connection(port['device']):
            print(f"✅ Arduino encontrado em {port['device']}")
            return port['device']
    
    print("❌ Arduino não encontrado em nenhuma porta")
    return None

def save_serial_config(port):
    """Salvar configuração da porta serial"""
    try:
        config = {'serial_port': port}
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f)
        print(f"💾 Configuração salva: {port}")
        return True
    except Exception as e:
        print(f"❌ Erro ao salvar configuração: {e}")
        return False

def load_serial_config():
    """Carregar configuração da porta serial"""
    try:
        if os.path.exists(CONFIG_FILE):
            with open(CONFIG_FILE, 'r') as f:
                config = json.load(f)
                return config.get('serial_port')
    except Exception as e:
        print(f"❌ Erro ao carregar configuração: {e}")
    return None

def open_ndi_screen_capture():
    """Abrir NDI Screen Capture"""
    ndi_path = r"C:\Program Files\NDI\NDI 6 Tools\Screen Capture\Application.Network.ScanConverter2.x64.exe"
    
    if not os.path.exists(ndi_path):
        print("❌ NDI Screen Capture não encontrado em:", ndi_path)
        return False
    
    try:
        print("📡 Abrindo NDI Screen Capture...")
        # Usar subprocess para abrir NDI Screen Capture
        subprocess.Popen([ndi_path], shell=False)
        
        # Aguardar um pouco para o NDI inicializar
        time.sleep(3)
        print("✅ NDI Screen Capture iniciado!")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao abrir NDI Screen Capture: {e}")
        return False

def open_resolume_arena():
    """Abrir Resolume Arena no lado esquerdo"""
    resolume_path = r"C:\Program Files\Resolume Arena\Arena.exe"
    
    if not os.path.exists(resolume_path):
        print("❌ Resolume Arena não encontrado em:", resolume_path)
        return False
    
    try:
        print("🎬 Abrindo Resolume Arena no lado esquerdo...")
        # Usar subprocess para abrir Resolume Arena
        subprocess.Popen([resolume_path], shell=False)
        
        # Aguardar um pouco para o Resolume inicializar
        time.sleep(2)
        
        # Usar PowerShell para posicionar a janela no lado esquerdo
        ps_script = '''
        Add-Type -TypeDefinition @"
        using System;
        using System.Runtime.InteropServices;
        public class Win32 {
            [DllImport("user32.dll")]
            public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
            [DllImport("user32.dll")]
            public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);
            [DllImport("user32.dll")]
            public static extern bool SetForegroundWindow(IntPtr hWnd);
            [DllImport("user32.dll")]
            public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
        }
"@
        $arena = [Win32]::FindWindow($null, "Arena")
        if ($arena -ne [IntPtr]::Zero) {
            [Win32]::SetWindowPos($arena, [IntPtr]::Zero, 0, 0, 960, 1080, 0x0040)
            [Win32]::SetForegroundWindow($arena)
            [Win32]::ShowWindow($arena, 9)
        }
        '''
        
        subprocess.run(['powershell', '-Command', ps_script], shell=True)
        print("✅ Resolume Arena posicionado no lado esquerdo!")
        
        # Aguardar um pouco para o Resolume estabilizar
        time.sleep(3)
        
        # Enviar mensagem OSC para ativar primeira coluna
        try:
            import socket
            import struct
            
            # Comando OSC correto para Resolume: /composition/layers/1/clips/1/connect com valor 1
            osc_address = "/composition/layers/1/clips/1/connect"
            osc_value = 1  # 1 = conectar/play, 0 = desconectar/stop
            
            # Construir mensagem OSC
            # Endereço + padding para múltiplo de 4
            address_padded = (osc_address + '\x00' * (4 - (len(osc_address) % 4))).encode('utf-8')
            
            # Tipo de dados: ,i (integer)
            type_tag = ",i"
            type_tag_padded = (type_tag + '\x00' * (4 - (len(type_tag) % 4))).encode('utf-8')
            
            # Valor inteiro (4 bytes)
            value_bytes = struct.pack('>i', osc_value)
            
            # Montar mensagem completa
            osc_message = address_padded + type_tag_padded + value_bytes
            
            # Criar socket UDP
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sock.sendto(osc_message, ('127.0.0.1', 7000))
            sock.close()
            
            print("✅ Mensagem OSC enviada: /composition/layers/1/clips/1/connect = 1 na porta 7000")
        except Exception as e:
            print(f"⚠️ Erro ao enviar mensagem OSC: {e}")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao abrir Resolume Arena: {e}")
        return False

def open_chrome_with_layout():
    """Abrir Chrome com layout específico (lado direito, zoom 50%)"""
    if not CHROME_PATH:
        print("❌ Chrome não encontrado, abrindo navegador padrão...")
        webbrowser.open(GAME_URL)
        return
    
    try:
        # Comando para abrir Chrome no lado direito com zoom 75%
        cmd = [
            CHROME_PATH,
            '--new-window',
            '--window-position=960,0',  # Posição no lado direito
            '--window-size=960,1080',   # Tamanho da janela
            '--force-device-scale-factor=0.75',  # Zoom 75%
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            GAME_URL
        ]
        
        print("🌐 Abrindo Chrome no lado direito...")
        subprocess.Popen(cmd, shell=False)
        print("✅ Chrome aberto com sucesso!")
        
    except Exception as e:
        print(f"❌ Erro ao abrir Chrome: {e}")
        print("🔄 Tentando abrir navegador padrão...")
        webbrowser.open(GAME_URL)

def start_server():
    """Iniciar servidor BikeJJ"""
    try:
        print("🚀 Iniciando servidor BikeJJ...")
        # Usar subprocess para manter o servidor rodando em background
        env = os.environ.copy()
        env['PYTHONIOENCODING'] = 'utf-8'
        
        # Executar em background sem capturar stdout/stderr
        process = subprocess.Popen([sys.executable, 'server.py'], 
                                 env=env,
                                 creationflags=subprocess.CREATE_NEW_CONSOLE if os.name == 'nt' else 0)
        
        # Aguardar um pouco para o servidor inicializar
        time.sleep(2)
        
        # Verificar se o processo ainda está rodando
        if process.poll() is None:
            print("✅ Servidor iniciado com sucesso!")
            return process
        else:
            print("❌ Servidor falhou ao iniciar")
            return None
            
    except Exception as e:
        print(f"❌ Erro ao iniciar servidor: {e}")
        return None

def check_system_requirements():
    """Verificar requisitos do sistema"""
    print("🔍 Verificando requisitos do sistema...")
    
    # 1. Verificar Python
    try:
        import sys
        python_version = sys.version_info
        if python_version.major >= 3 and python_version.minor >= 8:
            print(f"✅ Python {python_version.major}.{python_version.minor}.{python_version.micro} - OK")
        else:
            print(f"❌ Python {python_version.major}.{python_version.minor}.{python_version.micro} - Versão muito antiga!")
            return False
    except Exception as e:
        print(f"❌ Erro ao verificar Python: {e}")
        return False
    
    # 2. Verificar arquivos necessários
    required_files = ['server.py', 'index.html', 'script.js', 'styles.css']
    for file in required_files:
        if os.path.exists(file):
            print(f"✅ {file} - OK")
        else:
            print(f"❌ {file} - Não encontrado!")
            return False
    
    # 3. Verificar portas disponíveis
    try:
        import socket
        # Testar porta 9000
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex(('localhost', 9000))
        sock.close()
        if result == 0:
            print("⚠️ Porta 9000 já está em uso - será necessário parar o processo")
        else:
            print("✅ Porta 9000 - Disponível")
    except Exception as e:
        print(f"❌ Erro ao verificar porta 9000: {e}")
        return False
    
    # 4. Verificar Arduino
    print("🔍 Verificando Arduino...")
    arduino_found = False
    ports = get_available_ports()
    
    if ports:
        print(f"📡 {len(ports)} porta(s) encontrada(s):")
        for port in ports:
            print(f"   {port['device']} - {port['description']}")
        
        # Testar primeiro a porta configurada se existir
        configured_port = load_serial_config()
        if configured_port:
            print(f"🔌 Testando primeiro a porta configurada: {configured_port}")
            if test_arduino_connection(configured_port):
                print(f"✅ Arduino funcionando em {configured_port}")
                arduino_found = True
            else:
                print(f"❌ Arduino não responde em {configured_port}")
                # Se não funcionar, testar outras portas
                for port in ports:
                    if port['device'] != configured_port:
                        if test_arduino_connection(port['device']):
                            print(f"✅ Arduino funcionando em {port['device']}")
                            arduino_found = True
                            break
        else:
            # Se não há porta configurada, testar todas
            for port in ports:
                if test_arduino_connection(port['device']):
                    print(f"✅ Arduino funcionando em {port['device']}")
                    arduino_found = True
                    break
    else:
        print("❌ Nenhuma porta COM encontrada")
    
    if not arduino_found:
        print("⚠️ Arduino não encontrado - sistema funcionará sem sensores")
    
    return True

def main():
    """Função principal"""
    print("=" * 60)
    print("🚴 BikeJJ - Sistema de Inicialização Automática")
    print("=" * 60)
    
    # 1. Verificar requisitos do sistema
    if not check_system_requirements():
        print("❌ Verificação de requisitos falhou!")
        input("Pressione Enter para sair...")
        return
    
    print("\n✅ Todos os requisitos verificados!")
    print("🚀 Iniciando sistema...")
    
    # 2. Verificar se estamos no diretório correto
    if not os.path.exists('server.py'):
        print("❌ Arquivo server.py não encontrado!")
        print("💡 Execute este script no diretório do projeto BikeJJ")
        input("Pressione Enter para sair...")
        return
    
    # 2. Encontrar Chrome
    print("🔍 Procurando Google Chrome...")
    chrome_path = find_chrome()
    if chrome_path:
        print(f"✅ Chrome encontrado: {chrome_path}")
    else:
        print("⚠️ Chrome não encontrado, será usado navegador padrão")
    
    # 3. Verificar configuração da porta serial
    print("\n📡 Verificando configuração da porta serial...")
    configured_port = load_serial_config()
    
    if configured_port:
        print(f"📁 Porta configurada: {configured_port}")
        if test_arduino_connection(configured_port):
            print("✅ Arduino conectado e funcionando!")
        else:
            print("❌ Arduino não responde na porta configurada")
            configured_port = None
    
    # 4. Se não há porta configurada ou não funciona, procurar automaticamente
    if not configured_port:
        print("\n🔍 Procurando Arduino automaticamente...")
        arduino_port = find_arduino_port()
        
        if arduino_port:
            if save_serial_config(arduino_port):
                configured_port = arduino_port
            else:
                print("❌ Erro ao salvar configuração da porta")
        else:
            print("❌ Arduino não encontrado!")
            print("🔧 Abrindo configurador serial...")
            time.sleep(2)
    
    # 5. Iniciar servidor
    print("\n🚀 Iniciando servidor...")
    server_process = start_server()
    
    if not server_process:
        print("❌ Falha ao iniciar servidor!")
        input("Pressione Enter para sair...")
        return
    
    # 5.1. Aguardar servidor conectar com Arduino
    if configured_port:
        print(f"⏳ Aguardando servidor conectar com Arduino em {configured_port}...")
        time.sleep(5)  # Aguardar mais tempo para conectar
    
    # 6. Aguardar servidor ficar pronto
    print("⏳ Aguardando servidor ficar pronto...")
    time.sleep(3)
    
    # 7. Abrir NDI Screen Capture
    print("\n📡 Abrindo NDI Screen Capture...")
    open_ndi_screen_capture()
    
    # 8. Abrir Resolume Arena (lado esquerdo)
    print("\n🎬 Abrindo Resolume Arena...")
    open_resolume_arena()
    
    # 9. Abrir Chrome (lado direito)
    print("\n🌐 Abrindo interface do jogo...")
    open_chrome_with_layout()
    
    # 10. Aguardar estabilização e dar play na primeira coluna do Resolume
    print("\n⏳ Aguardando estabilização do sistema...")
    time.sleep(5)  # Aguardar 5 segundos para tudo estabilizar
    
    print("🎬 Ativando primeira coluna do Resolume Arena...")
    try:
        import socket
        import struct
        
        # Comando OSC correto para Resolume: /composition/layers/1/clips/1/connect com valor 1
        osc_address = "/composition/layers/1/clips/1/connect"
        osc_value = 1  # 1 = conectar/play, 0 = desconectar/stop
        
        # Construir mensagem OSC
        # Endereço + padding para múltiplo de 4
        address_padded = (osc_address + '\x00' * (4 - (len(osc_address) % 4))).encode('utf-8')
        
        # Tipo de dados: ,i (integer)
        type_tag = ",i"
        type_tag_padded = (type_tag + '\x00' * (4 - (len(type_tag) % 4))).encode('utf-8')
        
        # Valor inteiro (4 bytes)
        value_bytes = struct.pack('>i', osc_value)
        
        # Montar mensagem completa
        osc_message = address_padded + type_tag_padded + value_bytes
        
        # Criar socket UDP
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.sendto(osc_message, ('127.0.0.1', 7000))
        sock.close()
        
        print("✅ Comando OSC enviado: /composition/layers/1/clips/1/connect = 1")
        
        # Aguardar um pouco e enviar comando de play novamente
        time.sleep(2)
        
        # Enviar comando de play novamente para garantir
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.sendto(osc_message, ('127.0.0.1', 7000))
        sock.close()
        
        print("✅ Comando de play enviado para primeira coluna!")
        
    except Exception as e:
        print(f"⚠️ Erro ao enviar comando OSC: {e}")
    
    # 11. Verificar status final da conexão
    if configured_port:
        print(f"\n✅ Arduino configurado na porta: {configured_port}")
        print("🎯 Sistema pronto para receber mensagens do Arduino!")
    else:
        print("\n⚠️ Arduino não encontrado - sistema funcionará sem sensores")
        print("💡 Para conectar Arduino, acesse: http://localhost:9000/serial_config.html")
    
    print("\n" + "=" * 60)
    print("✅ Sistema BikeJJ iniciado com sucesso!")
    print("=" * 60)
    print("🎮 O jogo está rodando em: http://localhost:9000")
    print("🔧 Configurador serial: http://localhost:9000/serial_config.html")
    print("\n✅ Sistema inicializado com sucesso!")
    print("💡 O servidor está rodando em background")
    print("=" * 60)
    
    # Aguardar um pouco para garantir que tudo foi iniciado
    time.sleep(2)
    print("🎯 Pronto para o evento!")

if __name__ == "__main__":
    main()
