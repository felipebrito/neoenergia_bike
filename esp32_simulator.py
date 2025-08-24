#!/usr/bin/env python3
"""
Simulador da ESP32 para BikeJJ
Envia dados dos sensores indutivos via serial
"""

import serial
import time
import random
import threading

class ESP32Simulator:
    def __init__(self, port='/dev/tty.usbserial-0001', baudrate=115200):
        self.port = port
        self.baudrate = baudrate
        self.serial = None
        self.is_running = False
        
    def connect(self):
        """Conectar à porta serial"""
        try:
            self.serial = serial.Serial(self.port, self.baudrate, timeout=1)
            print(f"🔌 ESP32 conectada na porta {self.port}")
            return True
        except Exception as e:
            print(f"❌ Erro ao conectar: {e}")
            return False
    
    def send_sensor_data(self, player_id, pedal_state):
        """Enviar dados do sensor"""
        if self.serial and self.serial.is_open:
            data = f"P{player_id}:{pedal_state}\n"
            self.serial.write(data.encode())
            print(f"📡 ESP32 → Jogador {player_id}: {'Pedalando' if pedal_state == 1 else 'Parado'}")
    
    def simulate_pedaling(self):
        """Simular pedaladas dos jogadores"""
        while self.is_running:
            try:
                # Simular pedaladas aleatórias
                for player_id in range(1, 5):
                    # 30% de chance de pedalar a cada segundo
                    if random.random() < 0.3:
                        self.send_sensor_data(player_id, 1)  # Pedalando
                        time.sleep(0.1)  # Pequena pausa
                        self.send_sensor_data(player_id, 0)  # Parou
                
                time.sleep(1)  # Aguardar 1 segundo
                
            except Exception as e:
                print(f"❌ Erro na simulação: {e}")
                break
    
    def start(self):
        """Iniciar simulador"""
        if self.connect():
            self.is_running = True
            print("🚀 Simulador ESP32 iniciado!")
            print("📊 Enviando dados dos sensores indutivos...")
            
            # Thread para simular pedaladas
            pedal_thread = threading.Thread(target=self.simulate_pedaling, daemon=True)
            pedal_thread.start()
            
            return True
        return False
    
    def stop(self):
        """Parar simulador"""
        self.is_running = False
        if self.serial:
            self.serial.close()
        print("🛑 Simulador ESP32 parado")

if __name__ == "__main__":
    # Listar portas disponíveis
    import serial.tools.list_ports
    ports = serial.tools.list_ports.comports()
    
    print("🔌 Portas seriais disponíveis:")
    for port in ports:
        print(f"  - {port.device}: {port.description}")
    
    # Tentar conectar na primeira porta disponível
    if ports:
        port = ports[0].device
        print(f"\n🎯 Tentando conectar na porta: {port}")
        
        simulator = ESP32Simulator(port=port)
        try:
            simulator.start()
            
            print("\n🎮 Simulador rodando...")
            print("Pressione Ctrl+C para parar")
            
            while True:
                time.sleep(1)
                
        except KeyboardInterrupt:
            print("\n🛑 Parando simulador...")
        finally:
            simulator.stop()
    else:
        print("❌ Nenhuma porta serial encontrada!")
        print("💡 Conecte a ESP32 ou use uma porta virtual")
