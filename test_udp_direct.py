#!/usr/bin/env python3
"""
Teste direto para o servidor UDP
"""

import socket
import json
import time

def test_udp_direct():
    """Testar UDP diretamente"""
    
    # Configurações
    UDP_IP = "127.0.0.1"
    UDP_PORT = 8887  # Porta do servidor UDP
    
    # Criar socket UDP
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    
    try:
        # Mensagem de teste
        test_message = {
            "type": "winner",
            "player_id": 2,
            "timestamp": time.time(),
            "message": "Teste direto UDP"
        }
        
        # Converter para JSON e enviar
        json_data = json.dumps(test_message)
        data = json_data.encode('utf-8')
        
        print(f"📤 Enviando mensagem direta para {UDP_IP}:{UDP_PORT}")
        print(f"📝 Mensagem: {json_data}")
        
        sock.sendto(data, (UDP_IP, UDP_PORT))
        
        print("✅ Mensagem enviada com sucesso!")
        print("🔍 Verifique se o listener UDP recebeu na porta 8889")
        
    except Exception as e:
        print(f"❌ Erro ao enviar mensagem: {e}")
    finally:
        sock.close()

if __name__ == "__main__":
    test_udp_direct()
