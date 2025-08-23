#!/usr/bin/env python3
"""
Servidor HTTP simples para o BikeJJ
Resolve problemas de persistência e CORS
"""

import http.server
import socketserver
import os
import webbrowser
from urllib.parse import urlparse

PORT = 8000

class BikeJJHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Adicionar headers para resolver problemas de CORS e cache
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()
    
    def do_GET(self):
        # Servir arquivos estáticos
        if self.path == '/':
            self.path = '/index.html'
        return super().do_GET()

def main():
    # Mudar para o diretório do projeto
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Criar servidor
    with socketserver.TCPServer(("", PORT), BikeJJHandler) as httpd:
        print(f"🚴 BikeJJ Server rodando em http://localhost:{PORT}")
        print(f"📁 Diretório: {os.getcwd()}")
        print("🌐 Abrindo no navegador...")
        print("⏹️  Pressione Ctrl+C para parar o servidor")
        
        # Abrir no navegador
        webbrowser.open(f'http://localhost:{PORT}')
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Servidor parado!")
            httpd.shutdown()

if __name__ == "__main__":
    main()
