#!/usr/bin/env python3
"""
Servidor HTTP simples para BikeJJ
Serve arquivos estáticos para o jogo
"""

import http.server
import socketserver
import os

# Configurações
PORT = 9003
DIRECTORY = "."

class BikeJJHTTPHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        # Adicionar CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

def main():
    print(f"🌐 Iniciando servidor HTTP na porta {PORT}...")
    print(f"📁 Servindo arquivos de: {os.path.abspath(DIRECTORY)}")
    
    with socketserver.TCPServer(("", PORT), BikeJJHTTPHandler) as httpd:
        print(f"✅ Servidor HTTP rodando em http://localhost:{PORT}")
        print(f"🎮 Acesse o jogo em: http://localhost:{PORT}")
        print("🛑 Pressione Ctrl+C para parar")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Parando servidor HTTP...")
            httpd.shutdown()

if __name__ == "__main__":
    main()
