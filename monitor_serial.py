#!/usr/bin/env python3
"""
Monitor Serial para Arduino Mega BikeJJ
Porta: COM6, Baudrate: 115200
"""

import serial
import time
import sys

def monitor_arduino():
    """Monitorar porta serial do Arduino"""
    try:
        # Conectar na porta serial
        ser = serial.Serial('COM6', 115200, timeout=1)
        print("🔌 Conectado ao Arduino Mega na COM6 (115200 baud)")
        print("📊 Monitorando leituras do sensor...")
        print("💡 Comandos: STATUS, J1:10, RESET, HELP")
        print("=" * 60)
        
        while True:
            try:
                # Ler linha da porta serial
                if ser.in_waiting > 0:
                    line = ser.readline().decode('utf-8', errors='ignore').strip()
                    if line:
                        print(line)
                
                time.sleep(0.01)  # Pequena pausa
                
            except KeyboardInterrupt:
                print("\n🛑 Monitor interrompido pelo usuário")
                break
            except Exception as e:
                print(f"❌ Erro na leitura: {e}")
                time.sleep(1)
                
    except serial.SerialException as e:
        print(f"❌ Erro ao conectar na COM6: {e}")
        print("💡 Verifique se:")
        print("   - Arduino está conectado na COM6")
        print("   - Porta não está sendo usada por outro programa")
        print("   - Firmware foi carregado corretamente")
    except Exception as e:
        print(f"❌ Erro: {e}")
    finally:
        if 'ser' in locals():
            ser.close()
            print("🔌 Conexão serial fechada")

if __name__ == "__main__":
    print("🚴 Monitor Serial BikeJJ Arduino Mega")
    print("=" * 40)
    monitor_arduino()
