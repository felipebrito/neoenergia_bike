#!/usr/bin/env python3
"""
Listener UDP robusto para BikeJJ
Funciona em paralelo com outras aplicações
"""

import socket
import json
import time
import threading

class RobustUDPListener:
    def __init__(self, port=8889):
        self.port = port
        self.is_running = False
        self.socket = None
        self.message_count = 0
        
    def start(self):
        """Iniciar listener UDP"""
        try:
            # Criar socket UDP
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEPORT, 1)
            
            # Bind na porta
            self.socket.bind(('', self.port))
            self.is_running = True
            
            print(f"🎧 Listener UDP ROBUSTO iniciado na porta {self.port}")
            print(f"📡 Aguardando mensagens...")
            print(f"⚡ Configurado para funcionar em paralelo")
            print(f"⏹️  Pressione Ctrl+C para parar\n")
            
            # Loop principal de recebimento
            while self.is_running:
                try:
                    # Receber dados com timeout
                    self.socket.settimeout(1.0)
                    data, addr = self.socket.recvfrom(1024)
                    
                    # Processar mensagem
                    self.process_message(data, addr)
                    
                except socket.timeout:
                    # Timeout é normal, continuar
                    continue
                except Exception as e:
                    if self.is_running:
                        print(f"❌ Erro ao receber dados: {e}")
                        
        except Exception as e:
            print(f"❌ Erro ao iniciar listener: {e}")
        finally:
            self.stop()
    
    def process_message(self, data, addr):
        """Processar mensagem recebida"""
        try:
            # Decodificar JSON
            message = json.loads(data.decode('utf-8'))
            self.message_count += 1
            timestamp = time.strftime('%H:%M:%S', time.localtime())
            
            print(f"[{timestamp}] 📨 Mensagem #{self.message_count} recebida de {addr}:")
            print(f"   Tipo: {message.get('type', 'N/A')}")
            print(f"   Player ID: {message.get('player_id', 'N/A')}")
            print(f"   Timestamp: {message.get('timestamp', 'N/A')}")
            print(f"   Dados completos: {message}")
            print()
            
        except json.JSONDecodeError:
            timestamp = time.strftime('%H:%M:%S', time.localtime())
            print(f"[{timestamp}] ❌ Erro ao decodificar JSON: {data}")
            print()
        except Exception as e:
            timestamp = time.strftime('%H:%M:%S', time.localtime())
            print(f"[{timestamp}] ❌ Erro ao processar mensagem: {e}")
            print()
    
    def stop(self):
        """Parar listener"""
        self.is_running = False
        if self.socket:
            self.socket.close()
        print("🔌 Socket fechado")

def main():
    """Função principal"""
    listener = RobustUDPListener(8887)
    
    try:
        listener.start()
    except KeyboardInterrupt:
        print("\n🛑 Listener parado pelo usuário")
    finally:
        listener.stop()

if __name__ == "__main__":
    main()
