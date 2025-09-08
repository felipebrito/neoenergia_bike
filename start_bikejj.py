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

def test_arduino_connection(port, timeout=3):
    """Testar conexão com Arduino"""
    try:
        print(f"🔌 Testando conexão com {port}...")
        ser = serial.Serial(port, SERIAL_BAUDRATE, timeout=timeout)
        time.sleep(2)  # Aguardar inicialização
        
        # Tentar ler dados do Arduino
        data_received = False
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            if ser.in_waiting > 0:
                line = ser.readline().decode('utf-8', errors='ignore').strip()
                if line and ('🔍' in line or '📊' in line or '📈' in line):
                    data_received = True
                    print(f"✅ Arduino respondendo: {line[:50]}...")
                    break
            time.sleep(0.1)
        
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

def open_chrome_with_layout():
    """Abrir Chrome com layout específico (lado direito, zoom 50%)"""
    if not CHROME_PATH:
        print("❌ Chrome não encontrado, abrindo navegador padrão...")
        webbrowser.open(GAME_URL)
        return
    
    try:
        # Comando para abrir Chrome no lado direito com zoom 50%
        cmd = [
            CHROME_PATH,
            '--new-window',
            '--window-position=960,0',  # Posição no lado direito
            '--window-size=960,1080',   # Tamanho da janela
            '--force-device-scale-factor=0.5',  # Zoom 50%
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            GAME_URL
        ]
        
        print("🌐 Abrindo Chrome com layout otimizado...")
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
        # Usar subprocess para manter o servidor rodando
        process = subprocess.Popen([sys.executable, 'server.py'], 
                                 stdout=subprocess.PIPE, 
                                 stderr=subprocess.PIPE,
                                 text=True)
        
        # Aguardar um pouco para o servidor inicializar
        time.sleep(3)
        
        # Verificar se o servidor está rodando
        if process.poll() is None:
            print("✅ Servidor iniciado com sucesso!")
            return process
        else:
            print("❌ Erro ao iniciar servidor")
            return None
            
    except Exception as e:
        print(f"❌ Erro ao iniciar servidor: {e}")
        return None

def main():
    """Função principal"""
    print("=" * 60)
    print("🚴 BikeJJ - Sistema de Inicialização Automática")
    print("=" * 60)
    
    # 1. Verificar se estamos no diretório correto
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
    
    # 6. Aguardar servidor ficar pronto
    print("⏳ Aguardando servidor ficar pronto...")
    time.sleep(3)
    
    # 7. Abrir Chrome
    print("\n🌐 Abrindo interface do jogo...")
    open_chrome_with_layout()
    
    # 8. Se Arduino não foi encontrado, abrir configurador
    if not configured_port:
        print("\n🔧 Abrindo configurador serial...")
        time.sleep(2)
        try:
            if CHROME_PATH:
                subprocess.Popen([CHROME_PATH, CONFIG_URL])
            else:
                webbrowser.open(CONFIG_URL)
        except:
            pass
    
    print("\n" + "=" * 60)
    print("✅ Sistema BikeJJ iniciado com sucesso!")
    print("=" * 60)
    print("🎮 O jogo está rodando em: http://localhost:9000")
    print("🔧 Configurador serial: http://localhost:9000/serial_config.html")
    print("\n💡 Para parar o servidor, feche esta janela ou pressione Ctrl+C")
    print("=" * 60)
    
    try:
        # Manter o servidor rodando
        server_process.wait()
    except KeyboardInterrupt:
        print("\n🛑 Parando servidor...")
        server_process.terminate()
        print("✅ Servidor parado!")

if __name__ == "__main__":
    main()
