#!/usr/bin/env python3
"""
Servidor BikeJJ Robusto e OTIMIZADO para múltiplas pedaladas
Sistema de teste passo a passo para Arduino Mega
"""

import json
import time
import threading
import serial
import serial.tools.list_ports
from http.server import HTTPServer, BaseHTTPRequestHandler
import os

# Configurações
HTTP_PORT = 9000
SERIAL_BAUDRATE = 115200
SERIAL_PORT = None

# Configurações de sensibilidade (serão carregadas de arquivo)
GAME_CONFIG_FILE = 'game_config.json'
DEFAULT_ENERGY_GAIN = 1.5  # 1.5% por pedalada (mais realista)
DEFAULT_ENERGY_DECAY = 2.5  # 2.5% por segundo
DEFAULT_LED_STROBE = 200  # 200ms

# Configurações atuais do jogo
game_config = {
    'energy_gain_rate': DEFAULT_ENERGY_GAIN,
    'energy_decay_rate': DEFAULT_ENERGY_DECAY,
    'led_strobe_rate': DEFAULT_LED_STROBE
}

# Estado global do jogo
game_state = {
    'player1_energy': 0,
    'player2_energy': 0,
    'player3_energy': 0,
    'player4_energy': 0,
    'game_active': False,
    'pedal_count': [0, 0, 0, 0],
    'is_pedaling': [False, False, False, False],
    'last_pedal_time': [0, 0, 0, 0],
    'players_ready': [False, False, False, False],
    'game_can_start': False
}

# Thread de decaimento
decay_thread = None
decay_running = False

# Leitor serial
arduino_reader = None
serial_connected = False

def load_game_config():
    """Carregar configurações do jogo do arquivo"""
    global game_config
    try:
        if os.path.exists(GAME_CONFIG_FILE):
            with open(GAME_CONFIG_FILE, 'r') as f:
                config = json.load(f)
                game_config['energy_gain_rate'] = config.get('energy_gain_rate', DEFAULT_ENERGY_GAIN)
                game_config['energy_decay_rate'] = config.get('energy_decay_rate', DEFAULT_ENERGY_DECAY)
                game_config['led_strobe_rate'] = config.get('led_strobe_rate', DEFAULT_LED_STROBE)
                print(f"⚙️ Configurações do jogo carregadas: Ganho={game_config['energy_gain_rate']}%, Decaimento={game_config['energy_decay_rate']}%/s")
        else:
            print("💡 Usando configurações padrão do jogo")
            save_game_config()  # Salvar configurações padrão
    except Exception as e:
        print(f"❌ Erro ao carregar configurações do jogo: {e}")
        print("💡 Usando configurações padrão")

def save_game_config():
    """Salvar configurações do jogo no arquivo"""
    try:
        with open(GAME_CONFIG_FILE, 'w') as f:
            json.dump(game_config, f, indent=2)
        print(f"💾 Configurações do jogo salvas: {game_config}")
    except Exception as e:
        print(f"❌ Erro ao salvar configurações do jogo: {e}")

class ArduinoReader(threading.Thread):
    """Leitor OTIMIZADO de dados do Arduino Mega com buffering inteligente"""
    
    def __init__(self, port, baudrate=115200):
        super().__init__()
        self.port = port
        self.baudrate = baudrate
        self.serial = None
        self.running = False
        self.daemon = True
        self.pedal_buffer = []  # Buffer para múltiplas pedaladas
        self.last_process_time = 0
        self.buffer_threshold = 0.05  # Processar buffer a cada 50ms
    
    def run(self):
        """Executar leitura serial em loop OTIMIZADO com buffering"""
        global serial_connected
        
        while self.running:
            try:
                if not self.serial or not self.serial.is_open:
                    self.connect()
                
                if self.serial and self.serial.is_open:
                    # Ler todas as linhas disponíveis de uma vez
                    while self.serial.in_waiting > 0:
                        line = self.serial.readline().decode('utf-8', errors='ignore').strip()
                        if line:
                            self.add_to_buffer(line)
                    
                    # Processar buffer periodicamente
                    current_time = time.time()
                    if current_time - self.last_process_time >= self.buffer_threshold:
                        self.process_buffer()
                        self.last_process_time = current_time
                
                time.sleep(0.02)  # 20ms entre leituras (50 FPS)
                
            except Exception as e:
                print(f"❌ Erro na leitura serial: {e}")
                serial_connected = False
                time.sleep(0.5)
    
    def add_to_buffer(self, line):
        """Adicionar linha ao buffer de processamento"""
        if "Jogador" in line and "Pedalada" in line:
            self.pedal_buffer.append(line)
            print(f"📨 Arduino: {line}")
    
    def process_buffer(self):
        """Processar buffer de pedaladas em lote - OTIMIZADO"""
        if not self.pedal_buffer:
            return
        
        # Processar todas as pedaladas do buffer de uma vez
        for line in self.pedal_buffer:
            self.process_single_pedal(line)
        
        # Limpar buffer
        self.pedal_buffer.clear()
    
    def process_single_pedal(self, line):
        """Processar uma única pedalada - OTIMIZADO"""
        try:
            # Extrair número do jogador
            if "Jogador 1" in line:
                player_idx = 0
            elif "Jogador 2" in line:
                player_idx = 1
            elif "Jogador 3" in line:
                player_idx = 2
            elif "Jogador 4" in line:
                player_idx = 3
            else:
                return
            
            # Extrair número da pedalada
            if "Pedalada #" in line:
                pedal_num = line.split("Pedalada #")[1].split(" ")[0]
                print(f"🚴 ARDUINO - Jogador {player_idx + 1}: Pedalada #{pedal_num}")
                
                # Marcar jogador como pronto (primeira pedalada)
                if not game_state['players_ready'][player_idx]:
                    game_state['players_ready'][player_idx] = True
                    print(f"✅ Jogador {player_idx + 1}: PRIMEIRA PEDALADA - PRONTO!")
                    
                    # Verificar se todos estão prontos
                    all_ready = all(game_state['players_ready'])
                    if all_ready:
                        game_state['game_can_start'] = True
                        print("🎮 TODOS OS JOGADORES ESTÃO PRONTOS! Jogo pode iniciar!")
                    else:
                        ready_count = sum(game_state['players_ready'])
                        print(f"📊 Progresso: {ready_count}/4 jogadores prontos")
                
                # Incrementar energia IMEDIATAMENTE usando configuração
                energy_key = f'player{player_idx + 1}_energy'
                if game_state[energy_key] < 100:
                    energy_gain = game_config['energy_gain_rate']
                    game_state[energy_key] = min(100, game_state[energy_key] + energy_gain)
                    print(f"⚡ Jogador {player_idx + 1}: Energia = {game_state[energy_key]:.1f}% (+{energy_gain}%)")
                
                # Atualizar estado IMEDIATAMENTE
                game_state['is_pedaling'][player_idx] = True
                game_state['last_pedal_time'][player_idx] = time.time()
                game_state['pedal_count'][player_idx] = int(pedal_num)
                
        except Exception as e:
            print(f"❌ Erro ao processar pedalada: {e}")
    
    def connect(self):
        """Conectar ao Arduino"""
        global serial_connected
        
        try:
            if self.serial:
                self.serial.close()
            
            self.serial = serial.Serial(self.port, self.baudrate, timeout=0.1)
            serial_connected = True
            print(f"✅ Conectado ao Arduino Mega em {self.port}")
            
        except Exception as e:
            print(f"❌ Erro ao conectar: {e}")
            serial_connected = False
    
    def stop(self):
        """Parar leitor"""
        self.running = False
        if self.serial:
            self.serial.close()

def apply_energy_decay():
    """Aplicar decaimento de energia - OTIMIZADO para menor delay"""
    global game_state
    
    while decay_running:
        try:
            current_time = time.time()
            
            for player_idx in range(4):
                energy_key = f'player{player_idx + 1}_energy'
                is_pedaling = game_state['is_pedaling'][player_idx]
                current_energy = game_state[energy_key]
                last_pedal_time = game_state['last_pedal_time'][player_idx]
                
                # Timeout automático mais rápido (1.5 segundos sem pedalada)
                if is_pedaling and (current_time - last_pedal_time) > 1.5:
                    game_state['is_pedaling'][player_idx] = False
                    print(f"⏰ Jogador {player_idx + 1}: Timeout - Parou de pedalar")
                    is_pedaling = False
                
                # Aplicar decaimento se não estiver pedalando usando configuração
                if not is_pedaling and current_energy > 0:
                    decay_amount = game_config['energy_decay_rate'] * 0.1  # Usar configuração, verificar a cada 0.1s
                    new_energy = max(0, current_energy - decay_amount)
                    game_state[energy_key] = new_energy
                    print(f"🛑 Jogador {player_idx + 1}: {current_energy:.1f}% → {new_energy:.1f}%")
            
            time.sleep(0.1)  # Verificar a cada 0.1 segundos (10 FPS)
            
        except Exception as e:
            print(f"❌ Erro no decaimento: {e}")
            time.sleep(0.1)

class BikeJJHandler(BaseHTTPRequestHandler):
    """Handler HTTP para BikeJJ - OTIMIZADO"""
    
    def do_GET(self):
        """Processar requisições GET"""
        global arduino_reader, serial_connected, SERIAL_PORT
        
        if self.path == '/api/state':
            # Retornar estado do jogo IMEDIATAMENTE
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
            self.end_headers()
            
            response = {
                'player1_energy': game_state['player1_energy'],
                'player2_energy': game_state['player2_energy'],
                'player3_energy': game_state['player3_energy'],
                'player4_energy': game_state['player4_energy'],
                'game_active': game_state['game_active'],
                'pedal_count': game_state['pedal_count'],
                'is_pedaling': game_state['is_pedaling'],
                'players_ready': game_state['players_ready'],
                'game_can_start': game_state['game_can_start'],
                'serial_connected': serial_connected,
                'timestamp': time.time()  # Timestamp para debug
            }
            
            self.wfile.write(json.dumps(response).encode())
            return
        
        elif self.path == '/api/start-game':
            # Verificar se pode iniciar
            if not game_state['game_can_start']:
                ready_count = sum(game_state['players_ready'])
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                
                response = {
                    'success': False,
                    'message': f'Jogo não pode iniciar. Apenas {ready_count}/4 jogadores prontos.',
                    'ready_count': ready_count
                }
                self.wfile.write(json.dumps(response).encode())
                return
            
            # Iniciar jogo
            game_state['game_active'] = True
            print("🎮 Jogo iniciado!")
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'success': True, 'message': 'Jogo iniciado!'}).encode())
            return
        
        elif self.path == '/api/reset-game':
            # Resetar jogo
            game_state['game_active'] = False
            for i in range(4):
                game_state[f'player{i+1}_energy'] = 0
                game_state['pedal_count'][i] = 0
                game_state['is_pedaling'][i] = False
                game_state['last_pedal_time'][i] = 0
                game_state['players_ready'][i] = False
            game_state['game_can_start'] = False
            
            print("🔄 Jogo resetado!")
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'success': True, 'message': 'Jogo resetado!'}).encode())
            return
        
        elif self.path == '/api/serial/ports':
            """Listar portas seriais disponíveis"""
            try:
                ports = []
                for port in serial.tools.list_ports.comports():
                    ports.append({
                        'device': port.device,
                        'description': port.description,
                        'manufacturer': getattr(port, 'manufacturer', 'Unknown')
                    })
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'ports': ports}).encode())
                return
                
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': False, 'message': f'Erro: {e}'}).encode())
                return
        
        elif self.path == '/api/serial/status':
            """Status da conexão serial"""
            try:
                status = {
                    'connected': serial_connected,
                    'port': SERIAL_PORT,
                    'baudrate': SERIAL_BAUDRATE,
                    'arduino_reader_running': arduino_reader.running if arduino_reader else False
                }
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(status).encode())
                return
                
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': False, 'message': f'Erro: {e}'}).encode())
                return
        
        elif self.path == '/api/serial/connect':
            # Conectar ao Arduino
            
            if not SERIAL_PORT:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': False, 'message': 'Porta serial não configurada'}).encode())
                return
            
            try:
                if arduino_reader:
                    arduino_reader.stop()
                
                arduino_reader = ArduinoReader(SERIAL_PORT, SERIAL_BAUDRATE)
                arduino_reader.running = True
                arduino_reader.start()
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True, 'message': 'Arduino conectado!'}).encode())
                return
                
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': False, 'message': f'Erro: {e}'}).encode())
                return
        
        elif self.path == '/api/config':
            # Retornar configurações atuais do jogo
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(game_config).encode())
            return
        
        # Servir arquivos estáticos
        try:
            if self.path == '/':
                self.path = '/index.html'
            
            file_path = os.path.join('.', self.path.lstrip('/'))
            if os.path.exists(file_path) and os.path.isfile(file_path):
                with open(file_path, 'rb') as f:
                    content = f.read()
                
                self.send_response(200)
                if file_path.endswith('.html'):
                    self.send_header('Content-Type', 'text/html')
                elif file_path.endswith('.js'):
                    self.send_header('Content-Type', 'application/javascript')
                elif file_path.endswith('.css'):
                    self.send_header('Content-Type', 'text/css')
                else:
                    self.send_header('Content-Type', 'application/octet-stream')
                
                self.end_headers()
                self.wfile.write(content)
            else:
                self.send_response(404)
                self.end_headers()
                self.wfile.write(b"File not found")
                
        except Exception as e:
            print(f"❌ Erro ao servir arquivo: {e}")
            self.send_response(500)
            self.end_headers()
            self.wfile.write(f"Error: {str(e)}".encode())
    
    def do_POST(self):
        """Processar requisições POST"""
        if self.path == '/api/config/save':
            # Salvar configurações do jogo
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            try:
                # Validar e atualizar configurações
                if 'energy_gain_rate' in data:
                    game_config['energy_gain_rate'] = max(0.1, min(10.0, float(data['energy_gain_rate'])))
                if 'energy_decay_rate' in data:
                    game_config['energy_decay_rate'] = max(0.1, min(20.0, float(data['energy_decay_rate'])))
                if 'led_strobe_rate' in data:
                    game_config['led_strobe_rate'] = max(50, min(2000, int(data['led_strobe_rate'])))
                
                # Salvar no arquivo
                save_game_config()
                
                response = {'success': True, 'message': 'Configurações salvas com sucesso!', 'config': game_config}
                print(f"⚙️ Configurações atualizadas: {game_config}")
                
            except Exception as e:
                response = {'success': False, 'message': f'Erro ao salvar configurações: {str(e)}'}
                print(f"❌ Erro ao salvar configurações: {e}")
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
            
        else:
            self.send_response(404)
            self.end_headers()

def main():
    """Função principal"""
    global decay_thread, decay_running, SERIAL_PORT
    
    print("🚀 Iniciando Servidor BikeJJ Robusto e OTIMIZADO...")
    print("⚡ OTIMIZAÇÕES: Buffering inteligente + Processamento em lote")
    print("📊 MÚLTIPLAS PEDALADAS: Sem delay acumulativo!")
    
    # Carregar configurações do jogo
    load_game_config()
    
    # Detectar porta serial automaticamente
    ports = list(serial.tools.list_ports.comports())
    for port in ports:
        if 'usbserial' in port.device.lower():
            SERIAL_PORT = port.device
            print(f"🔌 Arduino detectado em: {SERIAL_PORT}")
            break
    
    if not SERIAL_PORT:
        print("⚠️ Arduino não detectado. Configure manualmente.")
        SERIAL_PORT = "/dev/cu.usbserial-1110"  # Porta padrão
    
    # Iniciar thread de decaimento OTIMIZADA
    decay_running = True
    decay_thread = threading.Thread(target=apply_energy_decay, daemon=True)
    decay_thread.start()
    print("⏰ Sistema de decaimento OTIMIZADO iniciado (100ms)")
    
    # Iniciar servidor HTTP
    try:
        server = HTTPServer(("", HTTP_PORT), BikeJJHandler)
        print(f"🌐 Servidor rodando em http://localhost:{HTTP_PORT}")
        print("🎯 Para testar:")
        print("   1. Acesse: http://localhost:9000")
        print("   2. Cada jogador deve dar uma pedalada no Arduino")
        print("   3. Quando todos pedalarem, o jogo pode iniciar")
        print("⚡ BUFFERING INTELIGENTE: Múltiplas pedaladas sem delay!")
        
        server.serve_forever()
        
    except KeyboardInterrupt:
        print("\n🛑 Parando servidor...")
    except Exception as e:
        print(f"❌ Erro no servidor: {e}")
    finally:
        decay_running = False
        if arduino_reader:
            arduino_reader.stop()
        print("✅ Servidor parado")

if __name__ == "__main__":
    main()
