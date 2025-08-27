#!/usr/bin/env python3
"""
Teste simples da porta serial
Só lê e mostra as mensagens do ESP32
"""

import serial
import time

# Configurações
SERIAL_PORT = '/dev/cu.usbserial-2130'
SERIAL_BAUDRATE = 115200

def test_serial():
    print(f"🔍 Testando porta serial: {SERIAL_PORT}")
    print(f"📡 Baudrate: {SERIAL_BAUDRATE}")
    print("=" * 50)
    
    try:
        # Conectar à porta serial
        ser = serial.Serial(SERIAL_PORT, SERIAL_BAUDRATE, timeout=1)
        print(f"✅ Conectado à porta {SERIAL_PORT}")
        print("🚴 Pedale na bicicleta para ver as mensagens...")
        print("🛑 Pressione Ctrl+C para parar")
        print("=" * 50)
        
        # Ler continuamente
        while True:
            if ser.in_waiting:
                try:
                    line = ser.readline().decode('utf-8', errors='ignore').strip()
                    if line:
                        print(f"📡 ESP32: {line}")
                except Exception as e:
                    print(f"❌ Erro ao decodificar: {e}")
            
            time.sleep(0.01)  # 10ms
            
    except serial.SerialException as e:
        print(f"❌ Erro ao conectar: {e}")
        print(f"💡 Verifique se o ESP32 está conectado na porta {SERIAL_PORT}")
    except KeyboardInterrupt:
        print("\n🛑 Parando teste...")
    finally:
        if 'ser' in locals():
            ser.close()
            print("🔌 Porta serial fechada")

if __name__ == "__main__":
    test_serial()
