#!/usr/bin/env python3
"""
Servidor HTTP simples para o BikeJJ
Resolve problemas de persistência e CORS
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
            # Endpoint para receber comandos de teclas da ESP32
            if self.path == '/api/key':
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                
                print(f"🎮 Comando recebido: {data}")
                
                # Adicionar comando à fila
                external_commands.append(data)
                
                # Resposta de sucesso
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                response = json.dumps({"status": "success", "message": "Comando recebido"})
                self.wfile.write(response.encode('utf-8'))
            
            # Endpoint para iniciar nova partida
            elif self.path == '/api/new-game':
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                
                print(f"🆕 Nova partida solicitada: {data}")
                
                # Adicionar comando de nova partida à fila
                external_commands.append({"type": "new_game"})
                
                # Resposta de sucesso
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                response = json.dumps({"status": "success", "message": "Nova partida iniciada"})
                self.wfile.write(response.encode('utf-8'))
                
            else:
                self.send_response(404)
                self.end_headers()
                
        except Exception as e:
            print(f"❌ Erro ao processar POST: {e}")
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = json.dumps({"status": "error", "message": str(e)})
            self.wfile.write(response.encode('utf-8'))

def start_server():
    """Iniciar o servidor HTTP"""
    try:
        with socketserver.TCPServer(("", PORT), BikeJJHandler) as httpd:
            print(f"🚀 Servidor BikeJJ rodando em http://localhost:{PORT}")
            print(f"📡 Endpoints disponíveis:")
            print(f"   GET  /api/commands     - Consultar comandos externos")
            print(f"   POST /api/key          - Receber comandos de teclas")
            print(f"   POST /api/new-game     - Iniciar nova partida")
            print(f"🌐 Abrindo navegador...")
            
            # Abrir navegador automaticamente
            webbrowser.open(f'http://localhost:{PORT}')
            
            # Manter servidor rodando
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n🛑 Servidor parado pelo usuário")
    except Exception as e:
        print(f"❌ Erro ao iniciar servidor: {e}")

if __name__ == "__main__":
    start_server()
