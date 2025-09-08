#!/usr/bin/env python3
"""
Monitor Serial para Análise Completa - Arduino Mega BikeJJ
Salva dados em arquivo para análise detalhada
"""

import serial
import time
import sys
from datetime import datetime

def monitor_arduino_with_analysis():
    """Monitorar porta serial com análise detalhada"""
    log_file = f"teste_analise_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
    
    try:
        # Conectar na porta serial
        ser = serial.Serial('COM6', 115200, timeout=1)
        print("🔌 Conectado ao Arduino Mega na COM6 (115200 baud)")
        print(f"📊 Monitorando leituras do sensor...")
        print(f"📁 Dados salvos em: {log_file}")
        print("🚴 TESTE: Gire lentamente até o máximo e deixe a inércia parar")
        print("=" * 80)
        
        with open(log_file, 'w', encoding='utf-8') as f:
            f.write(f"Teste de Análise - {datetime.now()}\n")
            f.write("=" * 50 + "\n")
            
            while True:
                try:
                    # Ler linha da porta serial
                    if ser.in_waiting > 0:
                        line = ser.readline().decode('utf-8', errors='ignore').strip()
                        if line:
                            timestamp = datetime.now().strftime('%H:%M:%S.%f')[:-3]
                            log_line = f"[{timestamp}] {line}"
                            print(log_line)
                            f.write(log_line + "\n")
                            f.flush()  # Forçar escrita imediata
                    
                    time.sleep(0.001)  # Leitura mais rápida
                    
                except KeyboardInterrupt:
                    print("\n🛑 Teste interrompido pelo usuário")
                    f.write(f"\nTeste interrompido em: {datetime.now()}\n")
                    break
                except Exception as e:
                    error_msg = f"❌ Erro na leitura: {e}"
                    print(error_msg)
                    f.write(error_msg + "\n")
                    time.sleep(1)
                    
    except serial.SerialException as e:
        print(f"❌ Erro ao conectar na COM6: {e}")
    except Exception as e:
        print(f"❌ Erro: {e}")
    finally:
        if 'ser' in locals():
            ser.close()
            print("🔌 Conexão serial fechada")
        print(f"📁 Log salvo em: {log_file}")

if __name__ == "__main__":
    print("🚴 Monitor Serial - Análise Completa BikeJJ")
    print("=" * 50)
    monitor_arduino_with_analysis()

