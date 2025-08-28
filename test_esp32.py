#!/usr/bin/env python3
"""
Script simples para testar comunicação com Arduino Mega
Apenas lê a porta serial e exibe as mensagens
"""

import serial
import time
import sys
import platform

# Configurações
# Detectar automaticamente baseado no sistema operacional
if platform.system() == 'Windows':
    SERIAL_PORT = 'COM3'  # Porta padrão no Windows
else:
    SERIAL_PORT = '/dev/cu.usbserial-130'  # Porta macOS
BAUDRATE = 115200

def test_arduino_mega():
    """Testa comunicação com Arduino Mega"""
    print(f"🔍 Testando comunicação com Arduino Mega...")
    print(f"📡 Porta: {SERIAL_PORT}")
    print(f"⚡ Baudrate: {BAUDRATE}")
    print("=" * 50)
    
    try:
        # Conectar à porta serial
        ser = serial.Serial(SERIAL_PORT, BAUDRATE, timeout=1)
        print(f"✅ Conectado ao Arduino Mega!")
        print(f"📊 Configuração: {ser.get_settings()}")
        print("=" * 50)
        print("🚴 Pedale a bicicleta para ver as mensagens...")
        print("🛑 Pressione Ctrl+C para parar")
        print("=" * 50)
        
        # Loop de leitura
        while True:
            if ser.in_waiting > 0:
                try:
                    line = ser.readline().decode('utf-8').strip()
                    if line:
                        print(f"📨 Arduino Mega: {line}")
                except UnicodeDecodeError:
                    # Ignorar linhas com problemas de codificação
                    pass
            
            time.sleep(0.1)  # Pequena pausa
            
    except serial.SerialException as e:
        print(f"❌ Erro ao conectar: {e}")
        print(f"💡 Dica: Verifique se o Arduino Mega está conectado e a porta está correta")
        print(f"💡 No Windows, use portas COM (ex: COM3, COM4)")
        print(f"💡 No macOS, use portas cu (ex: /dev/cu.usbserial-XXX)")
        return False
    except KeyboardInterrupt:
        print("\n🛑 Teste interrompido pelo usuário")
    finally:
        if 'ser' in locals() and ser.is_open:
            ser.close()
            print("🔌 Conexão serial fechada")
    
    return True

if __name__ == "__main__":
    test_arduino_mega()
