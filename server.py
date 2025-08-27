#!/usr/bin/env python3
"""
Servidor BikeJJ simplificado
Lê ESP32 e serve HTML com atualizações em tempo real
"""

import serial
import threading
import time
import http.server
import socketserver
import json

# Configurações
HTTP_PORT = 9003
SERIAL_PORT = '/dev/cu.usbserial-2130'
SERIAL_BAUDRATE = 115200

# Estado do jogo
game_state = {
    'player1_energy': 0,
    'game_active': False,
    'pedal_count': 0,
    'is_pedaling': False,
    'inactivity_count': 0,  # Contador de mensagens de inatividade
    'last_pedal_time': 0,   # Timestamp da última pedalada real
    'inactivity_timer': 0   # Timer de inatividade baseado em tempo
}

class ESP32Reader:
    def __init__(self):
        self.serial_conn = None
        self.running = False

    def start(self):
        try:
            self.serial_conn = serial.Serial(SERIAL_PORT, SERIAL_BAUDRATE, timeout=1)
            self.running = True
            print(f"📡 Conectado ao ESP32 na porta {SERIAL_PORT}")

            # Thread de leitura serial
            self.read_thread = threading.Thread(target=self._read_serial, daemon=True)
            self.read_thread.start()

        except Exception as e:
            print(f"❌ Erro ao conectar com ESP32: {e}")

    def stop(self):
        self.running = False
        if self.serial_conn:
            self.serial_conn.close()

    def _read_serial(self):
        while self.running:
            try:
                if self.serial_conn and self.serial_conn.in_waiting:
                    line = self.serial_conn.readline().decode('utf-8', errors='ignore').strip()
                    if line:
                        self._process_line(line)
                time.sleep(0.01)
            except Exception as e:
                print(f"❌ Erro na leitura serial: {e}")
                time.sleep(1)

    def _process_line(self, line):
        # CAPTURAR PEDALADA: TRUE/FALSE (mesma lógica das teclas QWER)
        if "Pedalada: True" in line:
            game_state['is_pedaling'] = True
            game_state['inactivity_count'] = 0  # Resetar contador de inatividade
            print(f"✅ ESP32: Pedalando = True - Resetando contador de inatividade")
            
        elif "Pedalada: False" in line:
            game_state['is_pedaling'] = False
            game_state['inactivity_count'] += 1  # Incrementar contador de mensagens
            
            # LÓGICA BASEADA EM TEMPO REAL: Se passou 2 segundos sem pedalada, diminuir energia
            current_time = time.time()
            time_since_last_pedal = current_time - game_state['last_pedal_time']
            
            if time_since_last_pedal >= 0.5 and game_state['game_active']:  # 0.5 segundos de inatividade (mais rápido)
                if game_state['player1_energy'] > 0:
                    # Usar taxa de decaimento das configurações (padrão: 2.5% por segundo)
                    decay_rate = 2.5  # Taxa padrão do menu
                    energy_to_decay = (decay_rate * 0.5)  # Decaimento para 0.5 segundos
                    game_state['player1_energy'] = max(0, game_state['player1_energy'] - energy_to_decay)
                    print(f"🛑 ESP32: Inatividade por {time_since_last_pedal:.1f}s - Energia diminuindo: {energy_to_decay:.1f}% (Taxa: {decay_rate}%/s)")
                    game_state['last_pedal_time'] = current_time  # Resetar timer
                else:
                    print(f"🛑 ESP32: Inatividade por {time_since_last_pedal:.1f}s - Energia já está em 0%")
            else:
                print(f"🛑 ESP32: Pedalada: False (Inatividade #{game_state['inactivity_count']} - Tempo: {time_since_last_pedal:.1f}s)")
            
        # CAPTURAR INTERRUPÇÕES DE SENSOR PARA ENERGIA
        elif "🔍 Interrupção: Sensor HIGH" in line:
            try:
                # Extrair número da pedalada
                if "Pedalada #" in line:
                    pedal_num = line.split("Pedalada #")[1].split(" ")[0]
                    game_state['pedal_count'] = int(pedal_num)
                    print(f"🚴 INTERRUPÇÃO DETECTADA - Pedalada #{pedal_num}")
                    
                    # INCREMENTAR ENERGIA
                    if game_state['game_active']:
                        game_state['player1_energy'] += 3.0
                        if game_state['player1_energy'] > 100:
                            game_state['player1_energy'] = 100
                        print(f"🚴 PEDALADA #{pedal_num} - Energia: {game_state['player1_energy']:.1f}%")
                    else:
                        # JOGO SEMPRE DISPONÍVEL - iniciar automaticamente com primeira pedalada
                        game_state['game_active'] = True
                        game_state['player1_energy'] = 3.0
                        print(f"🎮 Jogo iniciado automaticamente com pedalada #{pedal_num}!")
                        print(f"🚴 PEDALADA #{pedal_num} - Energia: {game_state['player1_energy']:.1f}%")
                        
            except Exception as e:
                print(f"❌ Erro ao processar interrupção: {e}")
                
        # Atualizar contador quando disponível
        elif line.startswith("Pedaladas:"):
            try:
                count_str = line.split(":")[1].strip()
                new_count = int(count_str)
                if new_count > game_state['pedal_count']:
                    game_state['pedal_count'] = new_count
            except:
                pass

# Instância global do leitor ESP32
esp32_reader = ESP32Reader()

class BikeJJHTTPHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=".", **kwargs)

    def end_headers(self):
        # Adicionar CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        if self.path == '/api/state':
            # Retornar estado do jogo
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(game_state).encode())
        elif self.path == '/api/start-game':
            # Iniciar jogo
            game_state['game_active'] = True
            game_state['player1_energy'] = 0
            print("🎮 Jogo iniciado")
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"OK")
        elif self.path == '/api/reset-game':
            # Resetar jogo
            game_state['game_active'] = False
            game_state['player1_energy'] = 0
            print("🔄 Jogo resetado")
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"OK")
        else:
            # Servir arquivos estáticos
            super().do_GET()

def main():
    print("🚀 Iniciando servidor BikeJJ...")
    
    # Iniciar leitor ESP32
    esp32_reader.start()
    
    # Iniciar servidor HTTP
    with socketserver.TCPServer(("", HTTP_PORT), BikeJJHTTPHandler) as httpd:
        print(f"✅ Servidor HTTP rodando em http://localhost:{HTTP_PORT}")
        print(f"🎮 Acesse o jogo em: http://localhost:{HTTP_PORT}")
        print("🛑 Pressione Ctrl+C para parar")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Parando servidor...")
            esp32_reader.stop()

if __name__ == "__main__":
    main()
