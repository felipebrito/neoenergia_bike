#!/usr/bin/env python3
"""
Listener UDP simples para testar mensagens do BikeJJ
"""

import socket
import json
import time

def start_udp_listener(port=8887):
    """Iniciar listener UDP na porta especificada"""
    
    # Criar socket UDP
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    
    try:
        # Bind na porta
        sock.bind(('', port))
        print(f"🎧 Listener UDP iniciado na porta {port}")
        print(f"📡 Aguardando mensagens...")
        print(f"⏹️  Pressione Ctrl+C para parar\n")
        
        # Loop principal de recebimento
        while True:
            try:
                # Receber dados
                data, addr = sock.recvfrom(1024)
                
                # Decodificar JSON
                try:
                    message = json.loads(data.decode('utf-8'))
                    timestamp = time.strftime('%H:%M:%S', time.localtime())
                    
                    print(f"[{timestamp}] 📨 Mensagem recebida de {addr}:")
                    print(f"   Tipo: {message.get('type', 'N/A')}")
                    print(f"   Player ID: {message.get('player_id', 'N/A')}")
                    print(f"   Timestamp: {message.get('timestamp', 'N/A')}")
                    print(f"   Dados completos: {message}")
                    print()
                    
                except json.JSONDecodeError:
                    print(f"[{timestamp}] ❌ Erro ao decodificar JSON: {data}")
                    print()
                    
            except Exception as e:
                print(f"❌ Erro ao receber dados: {e}")
                
    except KeyboardInterrupt:
        print("\n🛑 Listener parado pelo usuário")
    except Exception as e:
        print(f"❌ Erro no listener: {e}")
    finally:
        sock.close()
        print("🔌 Socket fechado")

if __name__ == "__main__":
    start_udp_listener(8889)
