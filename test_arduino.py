#!/usr/bin/env python3
"""
Simulador de Arduino Mega para testar o sistema BikeJJ
Simula 4 jogadores dando pedaladas
"""

import serial
import time
import sys

def find_arduino_port():
    """Encontrar porta serial do Arduino"""
    import serial.tools.list_ports
    ports = serial.tools.list_ports.comports()
    
    # Procurar por portas que possam ser Arduino
    for port in ports:
        port_name = port.device.lower()
        if any(keyword in port_name for keyword in ['usbserial', 'usbmodem', 'com']):
            print(f"🔌 Porta encontrada: {port.device} - {port.description}")
            return port.device
    
    print("❌ Nenhuma porta Arduino encontrada")
    return None

def simulate_arduino():
    """Simular Arduino Mega enviando dados de 4 jogadores"""
    
    print("🚀 Simulador de Arduino Mega BikeJJ")
    print("=" * 50)
    
    # Conectar à porta serial
    port = find_arduino_port()
    if not port:
        print("💡 Use: python test_arduino.py /dev/cu.usbserial-XXX")
        return
    
    try:
        ser = serial.Serial(port, 115200, timeout=1)
        print(f"✅ Conectado ao Arduino em {port}")
        time.sleep(2)  # Aguardar estabilização
        
        # Simular pedaladas de cada jogador
        player_counts = [0, 0, 0, 0]
        
        print("\n🎯 TESTE: Cada jogador dará uma pedalada para ficar pronto")
        print("=" * 50)
        
        for player in range(1, 5):
            player_idx = player - 1
            player_counts[player_idx] += 1
            
            # Simular mensagens do Arduino Mega
            messages = [
                f"🔍 Jogador {player}: Pedalada #{player_counts[player_idx]} detectada",
                f"Jogador {player}: Pedalada: True",
                f"📊 Jogador {player}: Total de pedaladas: {player_counts[player_idx]}"
            ]
            
            print(f"\n🚴 Simulando Jogador {player}:")
            for msg in messages:
                print(f"  📤 Enviando: {msg}")
                ser.write((msg + "\n").encode())
                time.sleep(0.1)
            
            time.sleep(1)
        
        print("\n✅ Todos os jogadores deram sua primeira pedalada!")
        print("🎮 Agora o jogo pode ser iniciado")
        
        # Continuar simulando algumas pedaladas extras
        print("\n🔄 Simulando mais algumas pedaladas...")
        for round_num in range(3):
            for player in range(1, 5):
                player_idx = player - 1
                player_counts[player_idx] += 1
                
                msg = f"🔍 Jogador {player}: Pedalada #{player_counts[player_idx]} detectada"
                print(f"  📤 {msg}")
                ser.write((msg + "\n").encode())
                time.sleep(0.5)
        
        print("\n✅ Simulação completa!")
        ser.close()
        
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        port = sys.argv[1]
        try:
            ser = serial.Serial(port, 115200, timeout=1)
            print(f"✅ Conectado ao Arduino em {port}")
            
            # Simular pedaladas
            for i in range(10):
                player = (i % 4) + 1
                pedal_num = (i // 4) + 1
                msg = f"🔍 Jogador {player}: Pedalada #{pedal_num} detectada"
                print(f"📤 {msg}")
                ser.write((msg + "\n").encode())
                time.sleep(1)
            
            ser.close()
        except Exception as e:
            print(f"❌ Erro: {e}")
    else:
        simulate_arduino()
