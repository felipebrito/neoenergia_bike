#!/usr/bin/env python3
"""
Servidor simples para BikeJJ com ESP32
"""

import json
import http.server
import socketserver
import serial
import threading
import time
from collections import deque

# Configurações
PORT = 9002
SERIAL_PORT = '/dev/cu.usbserial-110'
SERIAL_BAUDRATE = 115200
ENERGY_PER_PEDAL = 3.0

# Estado do jogo
external_commands = deque()
current_game_state = {
    'player1_energy': 0,
    'game_active': False,
    'last_pedal_time': 0
}

class ESP32Reader:
    def __init__(self, port, baudrate):
        self.port = port
        self.baudrate = baudrate
        self.serial = None
        self.running = False
        self.pedal_count = 0
        self.last_pedal_state = False
        self.last_pedal_time = 0
        self.debounce_time = 500
        self.last_false_time = 0
        self.false_cooldown = 1000  # 1 segundo entre False consecutivos
        
    def start(self):
        try:
            self.serial = serial.Serial(self.port, self.baudrate, timeout=1)
            self.running = True
            print(f"📡 Conectado ao ESP32 na porta {self.port}")
            
            # Iniciar thread de leitura
            self.read_thread = threading.Thread(target=self._read_serial)
            self.read_thread.daemon = True
            self.read_thread.start()
            
        except Exception as e:
            print(f"❌ Erro ao conectar ao ESP32: {e}")
            
    def stop(self):
        self.running = False
        if self.serial:
            self.serial.close()
            
    def _read_serial(self):
        while self.running:
            try:
                if self.serial and self.serial.in_waiting:
                    line = self.serial.readline().decode('utf-8').strip()
                    if line:
                        self._process_serial_line(line)
                time.sleep(0.1)
            except Exception as e:
                print(f"❌ Erro na leitura serial: {e}")
                time.sleep(1)
                
    def _process_serial_line(self, line):
        try:
            if "Pedalada: True" in line:
                # Só processar se não estava pedalando antes
                if not self.last_pedal_state:
                    current_time = int(time.time() * 1000)
                    if (self.last_pedal_time == 0 or 
                        (current_time - self.last_pedal_time) > self.debounce_time):
                        self.pedal_count += 1
                        self.last_pedal_time = current_time
                        self.last_pedal_state = True
                        self._handle_new_pedal()
                        print(f"⚡ Nova pedalada detectada! #{self.pedal_count}")
                    else:
                        print(f"⏭️ Pedalada ignorada por debounce")
                        
            elif "Pedalada: False" in line:
                # Só processar se estava pedalando antes E se passou tempo suficiente
                current_time = int(time.time() * 1000)
                if (self.last_pedal_state and 
                    (current_time - self.last_false_time) > self.false_cooldown):
                    command = {
                        'type': 'stop_pedaling',
                        'player_id': 1
                    }
                    external_commands.append(command)
                    self.last_pedal_state = False
                    self.last_false_time = current_time
                    print(f"🛑 ESP32: Jogador 1 parou de pedalar")
                    
        except Exception as e:
            print(f"❌ Erro ao processar linha: {e}")
            
    def _handle_new_pedal(self):
        if current_game_state['game_active']:
            current_game_state['player1_energy'] += ENERGY_PER_PEDAL
            
            if current_game_state['player1_energy'] > 100:
                current_game_state['player1_energy'] = 100
                
            command = {
                'type': 'pedal_energy',
                'player_id': 1,
                'energy': current_game_state['player1_energy'],
                'pedal_count': self.pedal_count
            }
            
            external_commands.append(command)
            print(f"⚡ Jogador 1: {current_game_state['player1_energy']:.1f}% (Pedalada #{self.pedal_count})")
            
            if current_game_state['player1_energy'] >= 100:
                self._handle_player_win(1)
                
    def _handle_player_win(self, player_id):
        print(f"🏆 Jogador {player_id} venceu!")
        win_command = {
            'type': 'winner',
            'player_id': player_id,
            'energy': current_game_state['player1_energy']
        }
        external_commands.append(win_command)
        self._reset_game()
        
    def _reset_game(self):
        current_game_state['player1_energy'] = 0
        current_game_state['game_active'] = False
        self.pedal_count = 0
        
        reset_command = {
            'type': 'reset_game',
            'player_id': 0
        }
        external_commands.append(reset_command)
        print("🔄 Jogo resetado!")

class BikeJJHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/commands':
            # Retornar comandos pendentes
            commands = list(external_commands)
            if commands:
                external_commands.clear()
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                'commands': commands,
                'game_state': current_game_state
            }
            self.wfile.write(json.dumps(response).encode())
            return
            
        elif self.path == '/api/start-game':
            current_game_state['game_active'] = True
            current_game_state['player1_energy'] = 0
            esp32_reader.pedal_count = 0
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {'status': 'success', 'message': 'Jogo iniciado!'}
            self.wfile.write(json.dumps(response).encode())
            return
            
        elif self.path == '/api/reset-game':
            esp32_reader._reset_game()
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {'status': 'success', 'message': 'Jogo resetado!'}
            self.wfile.write(json.dumps(response).encode())
            return
            
        # Servir arquivos estáticos
        try:
            if self.path == '/':
                self.path = '/index.html'
            
            file_path = '.' + self.path
            with open(file_path, 'rb') as f:
                content = f.read()
                
            if self.path.endswith('.html'):
                self.send_header('Content-type', 'text/html')
            elif self.path.endswith('.css'):
                self.send_header('Content-type', 'text/css')
            elif self.path.endswith('.js'):
                self.send_header('Content-type', 'application/javascript')
            else:
                self.send_header('Content-type', 'application/octet-stream')
                
            self.send_response(200)
            self.end_headers()
            self.wfile.write(content)
        except FileNotFoundError:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'File not found')
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(f'Error: {str(e)}'.encode())

def main():
    print("🔧 Iniciando BikeJJ Server Simples...")
    
    # Iniciar leitor ESP32
    global esp32_reader
    esp32_reader = ESP32Reader(SERIAL_PORT, SERIAL_BAUDRATE)
    
    try:
        esp32_reader.start()
        print("📡 Leitor serial ESP32 iniciado!")
    except Exception as e:
        print(f"⚠️ Aviso: Não foi possível conectar ao ESP32: {e}")
        print("💡 O jogo funcionará apenas com teclas")
    
    # Iniciar servidor HTTP
    try:
        print(f"🚀 Iniciando servidor HTTP na porta {PORT}...")
        httpd = http.server.HTTPServer(("localhost", PORT), BikeJJHandler)
        print(f"✅ Servidor HTTP iniciado com sucesso!")
        print(f"🌐 Acesse: http://localhost:{PORT}")
        print("⚡ Pronto para receber comandos do jogo e ESP32!")
        
        httpd.serve_forever()
    except Exception as e:
        print(f"❌ Erro ao iniciar servidor HTTP: {e}")
        import traceback
        traceback.print_exc()
    finally:
        print("🛑 Parando servidores...")
        esp32_reader.stop()

if __name__ == "__main__":
    main()
