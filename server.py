#!/usr/bin/env python3
"""
Servidor BikeJJ simplificado
Lê Arduino Mega e serve HTML com atualizações em tempo real
"""

import serial
import serial.tools.list_ports
import threading
import time
import http.server
import socketserver
import json
import os
import platform

# Configurações
HTTP_PORT = 9000
SERIAL_BAUDRATE = 115200

# Configuração da porta serial (será carregada de arquivo ou definida via interface)
SERIAL_PORT = None
CONFIG_FILE = 'serial_config.json'

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

def load_serial_config():
    """Carregar configuração da porta serial do arquivo"""
    global SERIAL_PORT
    try:
        if os.path.exists(CONFIG_FILE):
            with open(CONFIG_FILE, 'r') as f:
                config = json.load(f)
                loaded_port = config.get('serial_port')
                # ⚠️ VERIFICAR COMPATIBILIDADE COM O SISTEMA OPERACIONAL
                if loaded_port:
                    # Detectar se estamos no Windows vs Mac/Linux
                    is_windows = os.name == 'nt'
                    is_mac_linux_port = loaded_port.startswith('/dev/')
                    is_windows_port = loaded_port.startswith('COM')
                    
                    # Se estamos no Windows mas temos porta Mac/Linux, ignorar
                    if is_windows and is_mac_linux_port:
                        print(f"⚠️ Porta Mac/Linux detectada no Windows, ignorando: {loaded_port}")
                        print("🔧 Use http://localhost:9000/serial_config.html para configurar uma porta COM")
                        SERIAL_PORT = None
                    # Se estamos no Mac/Linux mas temos porta Windows, ignorar
                    elif not is_windows and is_windows_port:
                        print(f"⚠️ Porta Windows detectada no Mac/Linux, ignorando: {loaded_port}")
                        print("🔧 Use http://localhost:9000/serial_config.html para configurar uma porta /dev/")
                        SERIAL_PORT = None
                    # Verificar se a porta é válida para o sistema atual
                    elif is_valid_serial_port(loaded_port):
                        SERIAL_PORT = loaded_port
                        print(f"📁 Configuração carregada: {SERIAL_PORT}")
                    else:
                        print(f"⚠️ Porta configurada inválida: {loaded_port}")
                        SERIAL_PORT = None
                else:
                    SERIAL_PORT = None
        else:
            # NÃO detectar automaticamente - deixar usuário configurar
            print("💡 Nenhuma porta configurada automaticamente")
            print("🔧 Use o configurador serial para configurar manualmente")
            SERIAL_PORT = None
    except Exception as e:
        print(f"❌ Erro ao carregar configuração: {e}")
        SERIAL_PORT = None

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

def is_valid_serial_port(port):
    """Verificar se uma porta serial é válida para Arduino Mega"""
    if not port:
        return False
    
    # Portas que não são válidas para Arduino Mega
    invalid_patterns = [
        'debug-console',
        'Bluetooth',
        'modem',
        'dialout',
        'tty.Bluetooth',
        'tty.Bluetooth-Incoming-Port'
    ]
    
    for pattern in invalid_patterns:
        if pattern.lower() in port.lower():
            return False
    
    # No Windows, portas COM são sempre válidas
    if platform.system() == 'Windows':
        if port.upper().startswith('COM'):
            return True
        else:
            return False
    
    # No macOS/Linux, portas cu/tty são válidas
    valid_patterns = [
        'usbserial',
        'usbmodem',
        'ttyUSB',
        'ttyACM',
        'cu.usbserial',
        'cu.usbmodem'
    ]
    
    for pattern in valid_patterns:
        if pattern.lower() in port.lower():
            return True
    
    return False

def save_serial_config(port):
    """Salvar configuração da porta serial no arquivo"""
    try:
        config = {'serial_port': port}
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f)
        print(f"💾 Configuração salva: {port}")
    except Exception as e:
        print(f"❌ Erro ao salvar configuração: {e}")

def list_available_ports():
    """Listar todas as portas seriais disponíveis"""
    ports = []
    try:
        available_ports = serial.tools.list_ports.comports()
        for port in available_ports:
            port_info = {
                'port': port.device,
                'description': port.description,
                'manufacturer': port.manufacturer if port.manufacturer else 'N/A',
                'hwid': port.hwid,
                'vid': port.vid,
                'pid': port.pid
            }
            ports.append(port_info)
        
        # Ordenar portas: Windows COM primeiro, depois macOS cu, depois outras
        def sort_key(port_info):
            port = port_info['port'].upper()
            if platform.system() == 'Windows' and port.startswith('COM'):
                return (0, int(port[3:]) if port[3:].isdigit() else 999)
            elif port.startswith('/DEV/CU.'):
                return (1, port)
            else:
                return (2, port)
        
        ports.sort(key=sort_key)
        
        print(f"🔍 {len(ports)} portas seriais detectadas:")
        for port in ports:
            status = "✅ Válida" if is_valid_serial_port(port['port']) else "❌ Inválida"
            print(f"   📡 {port['port']} - {port['description']} ({port['manufacturer']}) - {status}")
        
        return ports
    except Exception as e:
        print(f"❌ Erro ao listar portas: {e}")
        return []

def change_serial_port(new_port):
    """Alterar porta serial e reconectar"""
    global SERIAL_PORT
    try:
        # Parar conexão atual
        if arduino_reader:
            arduino_reader.stop()
        
        # Atualizar porta
        SERIAL_PORT = new_port
        save_serial_config(new_port)
        
        # Reconectar se uma nova porta foi especificada
        if new_port and arduino_reader:
            success = arduino_reader.start()
            if success:
                print(f"✅ Porta serial alterada para: {new_port}")
                return True
            else:
                print(f"❌ Falha ao conectar na porta: {new_port}")
                return False
        else:
            print(f"✅ Desconectado da porta serial")
            return True
            
    except Exception as e:
        print(f"❌ Erro ao alterar porta: {e}")
        return False

# Estado do jogo
game_state = {
    'player1_energy': 0,
    'player2_energy': 0,
    'player3_energy': 0,
    'player4_energy': 0,
    'game_active': False,
    'pedal_count': [0, 0, 0, 0],  # Contador para cada jogador
    'is_pedaling': [False, False, False, False],  # Estado de pedalada para cada jogador
    'inactivity_count': [0, 0, 0, 0],  # Contador de inatividade para cada jogador
    'last_pedal_time': [0, 0, 0, 0],  # Timestamp da última pedalada para cada jogador
    'inactivity_timer': [0, 0, 0, 0],  # Timer de inatividade para cada jogador
    'players_ready': [False, False, False, False],  # NOVO: Jogadores que deram primeira pedalada
    'game_can_start': False  # NOVO: Se todos os jogadores estão prontos
}

# Timer para decaimento de energia (funciona independentemente do jogo)
last_decay_time = time.time()
DECAY_INTERVAL = 0.5  # Verificar decaimento a cada 0.5 segundos

def apply_energy_decay():
    """Aplicar decaimento de energia para todos os jogadores"""
    global last_decay_time
    current_time = time.time()
    
    # Verificar se é hora de aplicar decaimento
    if current_time - last_decay_time >= DECAY_INTERVAL:
        last_decay_time = current_time
        
        print(f"⏰ Aplicando decaimento de energia... (Taxa: {game_config['energy_decay_rate']}%/s)")
        
        for player_idx in range(4):
            energy_key = f'player{player_idx + 1}_energy'
            is_pedaling = game_state['is_pedaling'][player_idx]
            current_energy = game_state[energy_key]
            
            print(f"🔍 Jogador {player_idx + 1}: Energia={current_energy:.1f}%, Pedalando={is_pedaling}")
            
            # Resetar is_pedaling se passou muito tempo desde a última pedalada (modo teclado)
            last_pedal_time = game_state['last_pedal_time'][player_idx]
            if last_pedal_time > 0 and current_time - last_pedal_time > 2.0:  # 2s sem pedalada
                game_state['is_pedaling'][player_idx] = False
                is_pedaling = False
                print(f"🔄 Jogador {player_idx + 1}: Resetando estado de pedalada (tempo: {current_time - last_pedal_time:.1f}s)")
            
            # Aplicar decaimento apenas se o jogador não estiver pedalando
            if not is_pedaling and current_energy > 0:
                # Calcular decaimento para o intervalo usando configuração
                decay_amount = game_config['energy_decay_rate'] * DECAY_INTERVAL
                new_energy = max(0, current_energy - decay_amount)
                game_state[energy_key] = new_energy
                
                # Log da mudança
                if new_energy > 0:
                    print(f"🛑 Jogador {player_idx + 1}: {current_energy:.1f}% → {new_energy:.1f}% (Decaimento: {decay_amount:.1f}%)")
                else:
                    print(f"🛑 Jogador {player_idx + 1}: {current_energy:.1f}% → 0% (Energia esgotada)")
            elif is_pedaling:
                print(f"✅ Jogador {player_idx + 1}: Pedalando, sem decaimento")
            else:
                print(f"⏸️ Jogador {player_idx + 1}: Energia já em 0%")
        
        print("=" * 50)

# Thread independente para decaimento de energia
decay_thread = None
decay_running = False

def start_decay_thread():
    """Iniciar thread independente para decaimento de energia"""
    global decay_thread, decay_running
    if not decay_running:
        decay_running = True
        decay_thread = threading.Thread(target=decay_worker, daemon=True)
        decay_thread.start()
        print("⏰ Thread de decaimento iniciada")

def stop_decay_thread():
    """Parar thread de decaimento"""
    global decay_running
    decay_running = False
    print("⏰ Thread de decaimento parada")

def decay_worker():
    """Worker thread para aplicar decaimento continuamente"""
    global last_decay_time
    while decay_running:
        try:
            apply_energy_decay()
            time.sleep(0.1)  # Verificar a cada 100ms
        except Exception as e:
            print(f"❌ Erro na thread de decaimento: {e}")
            time.sleep(1)

class ArduinoMegaReader:
    def __init__(self):
        self.serial_conn = None
        self.running = False

    def start(self):
        if not SERIAL_PORT:
            print("⚠️ Nenhuma porta serial configurada")
            return False
            
        try:
            self.serial_conn = serial.Serial(SERIAL_PORT, SERIAL_BAUDRATE, timeout=1)
            self.running = True
            print(f"📡 Conectado ao Arduino Mega na porta {SERIAL_PORT}")

            # Thread de leitura serial
            self.read_thread = threading.Thread(target=self._read_serial, daemon=True)
            self.read_thread.start()
            return True

        except Exception as e:
            print(f"❌ Erro ao conectar com Arduino Mega: {e}")
            return False

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
        # Processar mensagens do Arduino Mega com 4 jogadores
        current_time = time.time()
        
        print(f"📨 Arduino: {line}")  # Debug: mostrar todas as mensagens
        
        # CAPTURAR PEDALADAS POR JOGADOR (Arduino Mega)
        if "Jogador" in line and "Pedalada:" in line:
            try:
                # Extrair número do jogador (1-4)
                if "Jogador 1:" in line:
                    player_idx = 0
                elif "Jogador 2:" in line:
                    player_idx = 1
                elif "Jogador 3:" in line:
                    player_idx = 2
                elif "Jogador 4:" in line:
                    player_idx = 3
                else:
                    print(f"⚠️ Jogador não reconhecido na mensagem: {line}")
                    return
                
                print(f"🎯 Processando mensagem para Jogador {player_idx + 1}")
                
                # Processar estado da pedalada
                if "Pedalada: True" in line:
                    game_state['is_pedaling'][player_idx] = True
                    game_state['inactivity_count'][player_idx] = 0
                    game_state['last_pedal_time'][player_idx] = current_time
                    print(f"✅ ARDUINO MEGA - Jogador {player_idx + 1}: Pedalando")
                    
                elif "Pedalada: False" in line:
                    game_state['is_pedaling'][player_idx] = False
                    game_state['inactivity_count'][player_idx] += 1
                    print(f"🛑 ARDUINO MEGA - Jogador {player_idx + 1}: Parou de pedalar (Inatividade #{game_state['inactivity_count'][player_idx]})")
                
                # Debug: mostrar estado atual do jogador
                energy_key = f'player{player_idx + 1}_energy'
                print(f"📊 Jogador {player_idx + 1}: Energia={game_state[energy_key]:.1f}%, Pedalando={game_state['is_pedaling'][player_idx]}")
            
            except Exception as e:
                print(f"❌ Erro ao processar mensagem do jogador: {e}")
                import traceback
                traceback.print_exc()
        
        # CAPTURAR INTERRUPÇÕES DE SENSOR (mensagens principais do Arduino Mega)
        elif "🔍 Jogador" in line and "Pedalada #" in line:
            try:
                # Extrair número do jogador e da pedalada
                if "Jogador 1:" in line:
                    player_idx = 0
                elif "Jogador 2:" in line:
                    player_idx = 1
                elif "Jogador 3:" in line:
                    player_idx = 2
                elif "Jogador 4:" in line:
                    player_idx = 3
                else:
                    return
                
                # Extrair número da pedalada
                if "Pedalada #" in line:
                    pedal_num = line.split("Pedalada #")[1].split(" ")[0]
                    print(f"🚴 ARDUINO MEGA - Jogador {player_idx + 1}: Pedalada #{pedal_num}")
                    
                    # MARCAR JOGADOR COMO PRONTO (primeira pedalada)
                    if not game_state['players_ready'][player_idx]:
                        game_state['players_ready'][player_idx] = True
                        print(f"✅ Jogador {player_idx + 1}: PRIMEIRA PEDALADA - Marcado como PRONTO!")
                        
                        # Verificar se todos os jogadores estão prontos
                        all_ready = all(game_state['players_ready'])
                        if all_ready:
                            game_state['game_can_start'] = True
                            print("🎮 TODOS OS JOGADORES ESTÃO PRONTOS! O jogo pode ser iniciado!")
                        else:
                            ready_count = sum(game_state['players_ready'])
                            print(f"📊 Progresso: {ready_count}/4 jogadores prontos")
                    
                    # Incrementar energia imediatamente na interrupção usando configuração
                    energy_key = f'player{player_idx + 1}_energy'
                    if game_state[energy_key] < 100:
                        energy_gain = game_config['energy_gain_rate']
                        game_state[energy_key] = min(100, game_state[energy_key] + energy_gain)
                        print(f"⚡ Jogador {player_idx + 1}: Energia incrementada para {game_state[energy_key]:.1f}% (+{energy_gain}%)")
                    
                    # Atualizar estado de pedalada
                    game_state['is_pedaling'][player_idx] = True
                    game_state['last_pedal_time'][player_idx] = current_time
                    game_state['inactivity_count'][player_idx] = 0
                    
                    # Atualizar contador de pedaladas
                    game_state['pedal_count'][player_idx] = int(pedal_num)
            
            except Exception as e:
                print(f"❌ Erro ao processar interrupção: {e}")
        
        # CAPTURAR CONTADORES DE PEDALADAS
        elif "Total de pedaladas:" in line:
            try:
                # Extrair número do jogador e contador
                if "Jogador 1:" in line:
                    player_idx = 0
                elif "Jogador 2:" in line:
                    player_idx = 1
                elif "Jogador 3:" in line:
                    player_idx = 2
                elif "Jogador 4:" in line:
                    player_idx = 3
                else:
                    return
                
                # Extrair contador
                if "Total de pedaladas:" in line:
                    count_str = line.split("Total de pedaladas:")[1].strip()
                    game_state['pedal_count'][player_idx] = int(count_str)
                    print(f"📊 Jogador {player_idx + 1}: Total de pedaladas: {count_str}")
            
            except Exception as e:
                print(f"❌ Erro ao processar contador de pedaladas: {e}")
        
        # CAPTURAR INTERRUPÇÕES DE SENSOR
        elif "🔍 Jogador" in line and "Pedalada #" in line:
            try:
                # Extrair número do jogador e da pedalada
                if "Jogador 1:" in line:
                    player_idx = 0
                elif "Jogador 2:" in line:
                    player_idx = 1
                elif "Jogador 3:" in line:
                    player_idx = 2
                elif "Jogador 4:" in line:
                    player_idx = 3
                else:
                    return
                
                # Extrair número da pedalada
                if "Pedalada #" in line:
                    pedal_num = line.split("Pedalada #")[1].split(" ")[0]
                    print(f"🚴 INTERRUPÇÃO DETECTADA - Jogador {player_idx + 1}: Pedalada #{pedal_num}")
            
            except Exception as e:
                print(f"❌ Erro ao processar interrupção: {e}")
        
        # Atualizar contador quando disponível
        elif line.startswith("Pedaladas:"):
            try:
                count_str = line.split(":")[1].strip()
                new_count = int(count_str)
                if new_count > game_state['pedal_count'][0]:  # Usar primeiro jogador como referência
                    game_state['pedal_count'][0] = new_count
            except:
                pass

# Instância global do leitor Arduino Mega
arduino_reader = ArduinoMegaReader()

class BikeJJHTTPHandler(http.server.BaseHTTPRequestHandler):
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
        print(f"🔍 GET request: {self.path}")
        
        # Rotas da API têm prioridade
        if self.path == '/api/state':
            # Retornar estado do jogo
            print(f"📊 Retornando estado do jogo: {game_state}")
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(game_state).encode())
            return
        elif self.path == '/api/start-game':
            # Verificar se todos os jogadores estão prontos
            if not game_state['game_can_start']:
                ready_count = sum(game_state['players_ready'])
                print(f"❌ Jogo não pode ser iniciado. Apenas {ready_count}/4 jogadores estão prontos.")
                self.send_response(400)  # Bad Request
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                response = {
                    'success': False,
                    'message': f'Jogo não pode ser iniciado. Apenas {ready_count}/4 jogadores estão prontos.',
                    'players_ready': game_state['players_ready'],
                    'ready_count': ready_count
                }
                self.wfile.write(json.dumps(response).encode())
                return
            
            # Iniciar jogo
            game_state['game_active'] = True
            # Resetar energia de todos os jogadores
            for i in range(4):
                game_state[f'player{i+1}_energy'] = 0
                game_state['pedal_count'][i] = 0
                game_state['is_pedaling'][i] = False
                game_state['inactivity_count'][i] = 0
                game_state['last_pedal_time'][i] = 0
                game_state['inactivity_timer'][i] = 0
                game_state['players_ready'][i] = False  # Resetar após iniciar
            game_state['game_can_start'] = False  # Resetar após iniciar
            print("🎮 Jogo iniciado para 4 jogadores")
            self.send_response(200)
            self.end_headers()
            self.wfile.write(json.dumps({'success': True, 'message': 'Jogo iniciado!'}).encode())
            return
        elif self.path == '/api/reset-game':
            # Resetar jogo
            game_state['game_active'] = False
            # Resetar energia de todos os jogadores
            for i in range(4):
                game_state[f'player{i+1}_energy'] = 0
                game_state['pedal_count'][i] = 0
                game_state['is_pedaling'][i] = False
                game_state['inactivity_count'][i] = 0
                game_state['last_pedal_time'][i] = 0
                game_state['inactivity_timer'][i] = 0
                game_state['players_ready'][i] = False  # Resetar jogadores prontos
            game_state['game_can_start'] = False  # Resetar flag de início
            print("🔄 Jogo resetado para 4 jogadores")
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"OK")
            return
        elif self.path == '/api/serial/ports':
            # Listar portas seriais disponíveis
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            ports = list_available_ports()
            response = {
                'ports': ports,
                'current_port': SERIAL_PORT,
                'connected': arduino_reader.running if arduino_reader else False
            }
            self.wfile.write(json.dumps(response).encode())
            return
        elif self.path == '/api/serial/status':
            # Status da conexão serial
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            status = {
                'current_port': SERIAL_PORT,
                'connected': arduino_reader.running if arduino_reader else False,
                'baudrate': SERIAL_BAUDRATE
            }
            self.wfile.write(json.dumps(status).encode())
            return
        elif self.path == '/api/serial/connect':
            # Conectar à porta serial selecionada no frontend
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            # O frontend deveria enviar a porta selecionada, mas por agora vamos usar a última configurada
            if SERIAL_PORT:
                try:
                    # Tentar conectar
                    if arduino_reader:
                        success = arduino_reader.start()
                        if success:
                            response = {'success': True, 'message': f'Conectado à porta {SERIAL_PORT}'}
                        else:
                            response = {'success': False, 'message': f'Falha ao conectar à porta {SERIAL_PORT}'}
                    else:
                        response = {'success': False, 'message': 'Arduino reader não inicializado'}
                except Exception as e:
                    response = {'success': False, 'message': f'Erro ao conectar: {str(e)}'}
            else:
                response = {'success': False, 'message': 'Nenhuma porta configurada. Selecione uma porta primeiro.'}
            
            self.wfile.write(json.dumps(response).encode())
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
            # Mapear rotas para arquivos
            if self.path == '/':
                self.path = '/index.html'
            elif self.path == '/serial':
                self.path = '/serial_config.html'
            
            # Verificar se o arquivo existe
            file_path = os.path.join('.', self.path.lstrip('/'))
            if os.path.exists(file_path) and os.path.isfile(file_path):
                # Determinar tipo de conteúdo
                if file_path.endswith('.html'):
                    content_type = 'text/html'
                elif file_path.endswith('.css'):
                    content_type = 'text/css'
                elif file_path.endswith('.js'):
                    content_type = 'application/javascript'
                elif file_path.endswith('.json'):
                    content_type = 'application/json'
                else:
                    content_type = 'application/octet-stream'
                
                # Ler e enviar arquivo
                with open(file_path, 'rb') as f:
                    content = f.read()
                
                self.send_response(200)
                self.send_header('Content-Type', content_type)
                self.end_headers()
                self.wfile.write(content)
            else:
                # Arquivo não encontrado
                self.send_response(404)
                self.send_header('Content-Type', 'text/plain')
                self.end_headers()
                self.wfile.write(b"File not found")
                
        except Exception as e:
            print(f"❌ Erro ao servir arquivo {self.path}: {e}")
            self.send_response(500)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            self.wfile.write(f"Internal server error: {str(e)}".encode())
    
    def do_POST(self):
        if self.path == '/api/pedal':
            # Endpoint para simular pedaladas via teclado
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                
                player_id = data.get('player', 1)
                if 1 <= player_id <= 4:
                    player_idx = player_id - 1
                    energy_key = f'player{player_id}_energy'
                    
                    # Incrementar energia usando configuração
                    energy_gain = game_config['energy_gain_rate']
                    game_state[energy_key] = min(100, game_state[energy_key] + energy_gain)
                    game_state['is_pedaling'][player_idx] = True
                    game_state['last_pedal_time'][player_idx] = time.time()
                    game_state['pedal_count'][player_idx] += 1
                    
                    print(f"⌨️ TECLADO - Jogador {player_id}: Energia = {game_state[energy_key]:.1f}% (+{energy_gain}%)")
                    
                    # Verificar vitória
                    if game_state[energy_key] >= 100:
                        print(f"🏆 VITÓRIA! Jogador {player_id} chegou a 100% de energia!")
                        game_state['game_active'] = False
                        
                        # Resetar energia de todos os jogadores
                        for i in range(4):
                            game_state[f'player{i+1}_energy'] = 0
                            game_state['pedal_count'][i] = 0
                            game_state['is_pedaling'][i] = False
                            game_state['last_pedal_time'][i] = 0
                            game_state['players_ready'][i] = False
                        game_state['game_can_start'] = False
                        print("🔄 Jogo resetado após vitória!")
                    
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    response = {'success': True, 'energy': game_state[energy_key]}
                    self.wfile.write(json.dumps(response).encode())
                else:
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    response = {'success': False, 'message': 'Player ID inválido'}
                    self.wfile.write(json.dumps(response).encode())
            except Exception as e:
                print(f"❌ Erro ao processar pedalada: {e}")
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                response = {'success': False, 'message': 'Erro interno'}
                self.wfile.write(json.dumps(response).encode())
                
        elif self.path == '/api/serial/change-port':
            # Alterar porta serial
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                
                new_port = data.get('port')
                print(f"🔧 Recebido pedido para alterar porta para: {new_port}")
                
                if new_port:
                    success = change_serial_port(new_port)
                    print(f"🔧 Resultado da alteração de porta: {success}")
                    response = {'success': success, 'port': new_port, 'message': f'Porta configurada para {new_port}'}
                else:
                    print("❌ Porta não especificada na requisição")
                    response = {'success': False, 'error': 'Porta não especificada'}
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode())
            except Exception as e:
                print(f"❌ Erro ao processar mudança de porta: {e}")
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                response = {'success': False, 'error': f'Erro interno: {str(e)}'}
                self.wfile.write(json.dumps(response).encode())
            
        elif self.path == '/api/config/save':
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
    print("🚀 Iniciando servidor BikeJJ...")
    
    # Carregar configurações
    load_serial_config()
    load_game_config()
    
    # NÃO iniciar leitor Arduino Mega automaticamente
    # Deixar o usuário configurar via interface
    if SERIAL_PORT:
        print(f"📁 Porta configurada: {SERIAL_PORT}")
        print("💡 Use o configurador serial para conectar")
    else:
        print("⚠️ Nenhuma porta serial configurada")
        print("💡 Use o configurador serial para configurar")
    
    print("🔧 IMPORTANTE: Configure a porta serial antes de iniciar o jogo!")
    
    # Mensagem específica para Windows
    if platform.system() == 'Windows':
        print("💻 Windows detectado!")
        print("🔌 Portas COM disponíveis: COM3, COM4, COM5, etc.")
        print("📱 Conecte o Arduino Mega via USB")
        print("🌐 Abra: http://localhost:9000/serial_config.html")
        print("⚙️ Selecione a porta COM correta e clique em 'Conectar'")
    else:
        print("🍎 macOS/Linux detectado!")
        print("🔌 Portas disponíveis: /dev/cu.usbserial-*, /dev/ttyUSB*")
        print("📱 Conecte o Arduino Mega via USB")
        print("🌐 Abra: http://localhost:9000/serial_config.html")
        print("⚙️ Selecione a porta correta e clique em 'Conectar'")
    
    # INICIAR THREAD DE DECAIMENTO INDEPENDENTE
    print("⏰ Iniciando sistema de decaimento de energia...")
    start_decay_thread()
    
    # Iniciar servidor HTTP
    with socketserver.TCPServer(("", HTTP_PORT), BikeJJHTTPHandler) as httpd:
        print(f"✅ Servidor HTTP rodando em http://localhost:{HTTP_PORT}")
        print(f"🎮 Acesse o jogo em: http://localhost:{HTTP_PORT}")
        print(f"🔧 Configurador serial em: http://localhost:{HTTP_PORT}/serial_config.html")
        print("🛑 Pressione Ctrl+C para parar")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Parando servidor...")
            stop_decay_thread()  # Parar thread de decaimento
            if arduino_reader and arduino_reader.running:
                arduino_reader.stop()

if __name__ == "__main__":
    main()
