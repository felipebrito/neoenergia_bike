#!/usr/bin/env python3
"""
Servidor Serial para BikeJJ
Recebe dados da ESP32 e converte em comandos de teclado
"""

import serial
import time
import threading
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.request
import urllib.error

class SerialHandler:
    def __init__(self, port='/dev/tty.usbserial-0001', baudrate=115200):
        self.port = port
        self.baudrate = baudrate
        self.serial = None
        self.is_running = False
        self.last_states = {1: 0, 2: 0, 3: 0, 4: 0}  # Estado anterior de cada jogador
        
    def connect(self):
        """Conectar à porta serial"""
        try:
            self.serial = serial.Serial(self.port, self.baudrate, timeout=1)
            print(f"🔌 Conectado à ESP32 na porta {self.port}")
            return True
        except Exception as e:
            print(f"❌ Erro ao conectar: {e}")
            return False
    
    def process_sensor_data(self, data):
        """Processar dados do sensor"""
        try:
            # Formato esperado: P1:1, P2:0, etc.
            if data.startswith('P') and ':' in data:
                parts = data.strip().split(':')
                if len(parts) == 2:
                    player_id = int(parts[0][1:])  # Remove o 'P'
                    pedal_state = int(parts[1])
                    
                    if player_id in [1, 2, 3, 4]:
                        # Verificar mudança de estado
                        if pedal_state != self.last_states[player_id]:
                            if pedal_state == 1:
                                print(f"🚴 Jogador {player_id} começou a pedalar")
                                self.send_key_command(player_id, 'keydown')
                            else:
                                print(f"🛑 Jogador {player_id} parou de pedalar")
                                self.send_key_command(player_id, 'keyup')
                            
                            self.last_states[player_id] = pedal_state
                            
        except Exception as e:
            print(f"❌ Erro ao processar dados: {e}")
    
    def send_key_command(self, player_id, action):
        """Enviar comando de tecla para o servidor"""
        try:
            # Mapear jogador para tecla
            key_map = {1: 'KeyQ', 2: 'KeyW', 3: 'KeyE', 4: 'KeyR'}
            key = key_map.get(player_id)
            
            if key:
                # Enviar comando para o servidor HTTP
                data = {
                    'type': 'key_command',
                    'player_id': player_id,
                    'key': key,
                    'action': action,
                    'timestamp': time.time()
                }
                
                # Enviar para o servidor local
                url = 'http://localhost:8001/api/key'
                req = urllib.request.Request(url, 
                                          data=json.dumps(data).encode('utf-8'),
                                          headers={'Content-Type': 'application/json'})
                
                try:
                    with urllib.request.urlopen(req) as response:
                        print(f"✅ Comando enviado: {action} {key} para Jogador {player_id}")
                except urllib.error.URLError as e:
                    print(f"⚠️ Servidor não respondeu: {e}")
                    
        except Exception as e:
            print(f"❌ Erro ao enviar comando: {e}")
    
    def read_serial(self):
        """Ler dados da porta serial"""
        while self.is_running and self.serial and self.serial.is_open:
            try:
                if self.serial.in_waiting > 0:
                    data = self.serial.readline().decode('utf-8').strip()
                    if data:
                        print(f"📡 ESP32 → {data}")
                        self.process_sensor_data(data)
                else:
                    time.sleep(0.01)  # Pequena pausa
                    
            except Exception as e:
                print(f"❌ Erro na leitura serial: {e}")
                break
    
    def start(self):
        """Iniciar servidor serial"""
        if self.connect():
            self.is_running = True
            print("🚀 Servidor Serial iniciado!")
            print("📊 Aguardando dados da ESP32...")
            
            # Thread para ler dados seriais
            serial_thread = threading.Thread(target=self.read_serial, daemon=True)
            serial_thread.start()
            
            return True
        return False
    
    def stop(self):
        """Parar servidor serial"""
        self.is_running = False
        if self.serial:
            self.serial.close()
        print("🛑 Servidor Serial parado")

def main():
    # Listar portas disponíveis
    try:
        import serial.tools.list_ports
        ports = serial.tools.list_ports.comports()
        
        print("🔌 Portas seriais disponíveis:")
        for port in ports:
            print(f"  - {port.device}: {port.description}")
        
        # Tentar conectar na primeira porta disponível
        if ports:
            port = ports[0].device
            print(f"\n🎯 Tentando conectar na porta: {port}")
            
            handler = SerialHandler(port=port)
            try:
                handler.start()
                
                print("\n🎮 Servidor Serial rodando...")
                print("Pressione Ctrl+C para parar")
                
                while True:
                    time.sleep(1)
                    
            except KeyboardInterrupt:
                print("\n🛑 Parando servidor...")
            finally:
                handler.stop()
        else:
            print("❌ Nenhuma porta serial encontrada!")
            print("💡 Conecte a ESP32 ou use uma porta virtual")
            
    except ImportError:
        print("❌ Biblioteca pyserial não encontrada!")
        print("💡 Instale com: pip install pyserial")

if __name__ == "__main__":
    main()
