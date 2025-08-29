#!/usr/bin/env python3
"""
🔍 Teste de Comunicação com Arduino Mega
Testa a comunicação serial e mostra todos os dados recebidos
"""

import serial
import time
import sys

def test_arduino_mega():
    """Testa comunicação com Arduino Mega"""
    
    # Configuração da porta serial
    PORT = "/dev/cu.usbserial-1110"
    BAUD_RATE = 115200
    
    print(f"🔍 Testando comunicação com Arduino Mega...")
    print(f"📍 Porta: {PORT}")
    print(f"⚡ Baud Rate: {BAUD_RATE}")
    print("=" * 50)
    
    try:
        # Abrir conexão serial
        print("🔌 Conectando ao Arduino Mega...")
        ser = serial.Serial(PORT, BAUD_RATE, timeout=1)
        print("✅ Conexão estabelecida!")
        print("🔄 Aguardando dados do Arduino...")
        print("=" * 50)
        
        # Loop de leitura
        start_time = time.time()
        line_count = 0
        
        while True:
            try:
                # Ler linha do Arduino
                if ser.in_waiting > 0:
                    line = ser.readline().decode('utf-8', errors='ignore').strip()
                    if line:
                        line_count += 1
                        elapsed = time.time() - start_time
                        print(f"📨 [{elapsed:6.1f}s] Linha #{line_count:3d}: {line}")
                        
                        # Detectar tipos de mensagem
                        if "Pedalada:" in line:
                            print(f"🚴 DETECTADO: Mensagem de pedalada!")
                        elif "Jogador" in line and "Pedalada #" in line:
                            print(f"🎯 DETECTADO: Contador de pedaladas!")
                        elif "Total de pedaladas:" in line:
                            print(f"📊 DETECTADO: Total de pedaladas!")
                        elif "🔍" in line or "📊" in line:
                            print(f"📱 DETECTADO: Mensagem formatada!")
                        
                        print("-" * 30)
                
                # Mostrar status a cada 5 segundos
                if int(time.time() - start_time) % 5 == 0 and int(time.time() - start_time) > 0:
                    if line_count == 0:
                        print(f"⏰ [{time.time() - start_time:6.1f}s] Aguardando dados... (0 linhas recebidas)")
                    else:
                        print(f"⏰ [{time.time() - start_time:6.1f}s] Status: {line_count} linhas recebidas")
                
                time.sleep(0.1)  # Pequena pausa para não sobrecarregar
                
            except KeyboardInterrupt:
                print("\n🛑 Interrompido pelo usuário")
                break
            except Exception as e:
                print(f"❌ Erro na leitura: {e}")
                break
                
    except serial.SerialException as e:
        print(f"❌ Erro de conexão serial: {e}")
        print("🔧 Verifique:")
        print("   - Arduino Mega está conectado via USB")
        print("   - Porta serial está correta")
        print("   - Nenhum outro programa está usando a porta")
        print("   - Firmware está carregado no Arduino")
        
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")
        
    finally:
        if 'ser' in locals() and ser.is_open:
            ser.close()
            print("🔌 Conexão serial fechada")
        
        print("=" * 50)
        print(f"📊 Resumo do teste:")
        print(f"   - Tempo total: {time.time() - start_time:.1f}s")
        print(f"   - Linhas recebidas: {line_count}")
        if line_count == 0:
            print("   - ⚠️ NENHUMA LINHA RECEBIDA!")
            print("   - 🔧 Possíveis problemas:")
            print("     * Arduino não está enviando dados")
            print("     * Firmware não está carregado")
            print("     * Sensores não estão conectados")
            print("     * Baud rate incorreto")
        else:
            print("   - ✅ Dados recebidos com sucesso!")
        
        print("=" * 50)

if __name__ == "__main__":
    test_arduino_mega()
