#!/usr/bin/env python3
"""
Servidor HTTP simples para o BikeJJ
Resolve problemas de persistência e CORS
Inclui servidor UDP para comunicação com ESP32
"""

import http.server
import socketserver
import os
import webbrowser
import threading
import json
import time
from collections import deque
from urllib.parse import urlparse
from udp_server import start_udp_server

PORT = 8002

# Fila global de comandos externos da ESP32
external_commands = deque(maxlen=100)

class BikeJJHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Adicionar headers para resolver problemas de CORS e cache
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()
    
    def do_GET(self):
        # Endpoint para consultar comandos externos da ESP32
        if self.path == '/api/commands':
            try:
                # Retornar todos os comandos pendentes
                commands = list(external_commands)
                external_commands.clear()  # Limpar após enviar
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                response = json.dumps(commands)
                self.wfile.write(response.encode('utf-8'))
                
            except Exception as e:
                print(f"❌ Erro ao consultar comandos: {e}")
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                response = json.dumps({"status": "error", "message": str(e)})
                self.wfile.write(response.encode('utf-8'))
        
        # Servir arquivos estáticos
        elif self.path == '/':
            self.path = '/index.html'
            return super().do_GET()
        else:
            return super().do_GET()
    
    def do_POST(self):
        try:
            # Endpoint para envio de dados UDP
            if self.path == '/api/udp':
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                
                print(f"📨 POST recebido: {data}")
                
                # Processar comando UDP
                try:
                    from udp_server import udp_server
                    
                    if udp_server and udp_server.is_running:
                        if data.get('type') == 'winner':
                            print(f"🏆 Enviando vencedor: {data.get('player_id')}")
                            udp_server.send_winner(data.get('player_id'))
                        elif data.get('type') == 'reset':
                            print("🔄 Enviando reset do jogo")
                            udp_server.send_game_reset()
                        elif data.get('type') == 'test':
                            print(f"🧪 Enviando mensagem de teste: {data.get('player_id')}")
                            udp_server.send_test_message(data.get('player_id'))
                        else:
                            print(f"⚠️ Tipo de mensagem desconhecido: {data.get('type')}")
                    else:
                        print("❌ Servidor UDP não está rodando")
                        
                except Exception as udp_error:
                    print(f"❌ Erro no servidor UDP: {udp_error}")
                
                # Resposta de sucesso
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                response = json.dumps({"status": "success"})
                self.wfile.write(response.encode('utf-8'))
                
            # Endpoint para comandos de tecla da ESP32
            elif self.path == '/api/key':
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                
                print(f"🎮 Comando de tecla recebido: {data}")
                
                # Adicionar comando à fila para o frontend processar
                if data.get('type') == 'key_command':
                    key = data.get('key')
                    action = data.get('action')
                    player_id = data.get('player_id')
                    
                    command = {
                        'player_id': player_id,
                        'action': action,
                        'key': key,
                        'timestamp': time.time()
                    }
                    
                    external_commands.append(command)
                    print(f"🎯 Comando adicionado à fila: {action} da tecla {key} para Jogador {player_id}")
                    
                # Resposta de sucesso
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                response = json.dumps({"status": "success", "key_command": "queued"})
                self.wfile.write(response.encode('utf-8'))
                
            # Endpoint para iniciar nova partida
            elif self.path == '/api/new-game':
                try:
                    print("🔄 Comando para iniciar nova partida recebido")
                    
                    # Adicionar comando especial à fila
                    command = {
                        'type': 'new_game',
                        'timestamp': time.time()
                    }
                    
                    external_commands.append(command)
                    print("🎯 Comando de nova partida adicionado à fila")
                    
                    # Resposta de sucesso
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    response = json.dumps({"status": "success", "new_game": "queued"})
                    self.wfile.write(response.encode('utf-8'))
                    
                except Exception as e:
                    print(f"❌ Erro ao processar nova partida: {e}")
                    self.send_response(500)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    response = json.dumps({"status": "error", "message": str(e)})
                    self.wfile.write(response.encode('utf-8'))
                
            else:
                self.send_response(404)
                self.end_headers()
                
        except Exception as e:
            print(f"❌ Erro no POST: {e}")
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = json.dumps({"status": "error", "message": str(e)})
            self.wfile.write(response.encode('utf-8'))

def main():
    # Mudar para o diretório do projeto
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    print("🔧 Iniciando BikeJJ Server...")
    
    try:
        # Iniciar servidor UDP em thread separada
        print("📡 Iniciando servidor UDP...")
        udp_thread = threading.Thread(target=start_udp_server, daemon=True)
        udp_thread.start()
        
        # Aguardar um pouco para o UDP inicializar
        time.sleep(1)
        
        # Verificar se o UDP está rodando
        from udp_server import udp_server
        if udp_server and udp_server.is_running:
            print("✅ Servidor UDP iniciado com sucesso!")
        else:
            print("⚠️ Servidor UDP pode não estar funcionando corretamente")
        
    except Exception as e:
        print(f"❌ Erro ao iniciar servidor UDP: {e}")
    
    # Criar servidor HTTP
    with socketserver.TCPServer(("", PORT), BikeJJHandler) as httpd:
        print(f"🚴 BikeJJ Server rodando em http://localhost:{PORT}")
        print(f"📡 Servidor UDP rodando na porta 8887")
        print(f"📁 Diretório: {os.getcwd()}")
        print("🌐 Abrindo no navegador...")
        print("⏹️  Pressione Ctrl+C para parar os servidores")
        
        # Abrir no navegador
        webbrowser.open(f'http://localhost:{PORT}')
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Servidores parados!")
            httpd.shutdown()

if __name__ == "__main__":
    main()
