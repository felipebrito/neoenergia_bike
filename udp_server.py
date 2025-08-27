#!/usr/bin/env python3
"""
Servidor UDP para BikeJJ
Envia dados do vencedor para TouchDesigner na porta 8888
Servidor local roda na porta 8887
"""

import socket
import json
import threading
import time
from queue import Queue

class BikeJJUDPServer:
    def __init__(self, port=8887):
        self.port = port
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        self.is_running = False
        self.message_queue = Queue()
        
    def start(self):
        """Iniciar servidor UDP"""
        self.is_running = True
        
        # Thread para processar mensagens
        threading.Thread(target=self._process_messages, daemon=True).start()
        
        print(f"🚀 Servidor UDP BikeJJ iniciado na porta {self.port}")
        print(f"📡 Broadcast habilitado para envio de dados")
        print(f"⚡ Pronto para receber comandos do jogo")
        
    def stop(self):
        """Parar servidor UDP"""
        self.is_running = False
        self.socket.close()
        print("🛑 Servidor UDP parado")
        
    def send_winner(self, player_id):
        """Enviar ID do jogador vencedor (1-4)"""
        message = {
            "type": "winner",
            "player_id": player_id,
            "timestamp": time.time()
        }
        self._send_message(message)
        print(f"🏆 Enviado: Jogador {player_id} venceu!")
        
    def send_game_reset(self):
        """Enviar sinal de reset do jogo (0)"""
        message = {
            "type": "reset",
            "player_id": 0,
            "timestamp": time.time()
        }
        self._send_message(message)
        print(f"🔄 Enviado: Jogo resetado!")
        
    def send_game_data(self, data):
        """Enviar dados genéricos do jogo"""
        message = {
            "type": "game_data",
            "data": data,
            "timestamp": time.time()
        }
        self._send_message(message)
    
    def send_test_message(self, player_id):
        """Enviar mensagem de teste via UDP"""
        message = {
            "type": "test",
            "player_id": player_id,
            "timestamp": time.time()
        }
        self._send_message(message)
        print(f"🧪 Mensagem de teste enviada para fila UDP: Jogador {player_id}")
        
    def _send_message(self, message):
        """Adicionar mensagem à fila para envio"""
        self.message_queue.put(message)
        
    def _process_messages(self):
        """Processar fila de mensagens"""
        while self.is_running:
            try:
                if not self.message_queue.empty():
                    message = self.message_queue.get(timeout=0.1)
                    
                    # Converter para JSON
                    json_data = json.dumps(message)
                    data = json_data.encode('utf-8')
                    
                    print(f"📤 Processando mensagem: {json_data}")
                    
                    # Enviar para múltiplos destinos para garantir recepção
                    destinations = [
                        ('127.0.0.1', 8888),           # TouchDesigner/Aparato (porta 8888)
                        ('127.0.0.1', self.port),      # Localhost (porta 8887)
                        ('localhost', self.port),       # Localhost (nome)
                    ]
                    
                    for dest_ip, dest_port in destinations:
                        try:
                            self.socket.sendto(data, (dest_ip, dest_port))
                            print(f"✅ UDP enviado para {dest_ip}:{dest_port}")
                        except Exception as e:
                            print(f"⚠️ Erro ao enviar para {dest_ip}:{dest_port}: {e}")
                    
                time.sleep(0.01)  # Pequena pausa para não sobrecarregar
                
            except Exception as e:
                if self.is_running:
                    print(f"❌ Erro no servidor UDP: {e}")
                    
# Instância global do servidor UDP
udp_server = BikeJJUDPServer()

def start_udp_server():
    """Função para iniciar o servidor UDP"""
    udp_server.start()
    
def send_winner_udp(player_id):
    """Função para enviar vencedor via UDP"""
    udp_server.send_winner(player_id)
    
def send_reset_udp():
    """Função para enviar reset via UDP"""
    udp_server.send_game_reset()

if __name__ == "__main__":
    # Teste do servidor UDP
    try:
        udp_server.start()
        
        print("\n🎮 Comandos de teste:")
        print("1-4: Enviar vencedor")
        print("0: Reset do jogo")
        print("q: Sair\n")
        
        while True:
            command = input("Digite um comando: ").strip()
            
            if command == 'q':
                break
            elif command in ['1', '2', '3', '4']:
                udp_server.send_winner(int(command))
            elif command == '0':
                udp_server.send_game_reset()
            else:
                print("❌ Comando inválido")
                
    except KeyboardInterrupt:
        print("\n🛑 Parando servidor...")
    finally:
        udp_server.stop()
