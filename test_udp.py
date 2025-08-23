#!/usr/bin/env python3
"""
Teste simples para verificar se o UDP está funcionando
"""

import socket
import json
import time

def test_udp_connection():
    """Testar conexão UDP"""
    
    # Configurações
    UDP_IP = "127.0.0.1"
    UDP_PORT = 8887  # Porta do listener
    
    # Criar socket UDP
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    
    try:
        # Mensagem de teste
        test_message = {
            "type": "test",
            "player_id": 1,
            "timestamp": time.time(),
            "message": "Teste de conexão UDP"
        }
        
        # Converter para JSON e enviar
        json_data = json.dumps(test_message)
        data = json_data.encode('utf-8')
        
        print(f"📤 Enviando mensagem de teste para {UDP_IP}:{UDP_PORT}")
        print(f"📝 Mensagem: {json_data}")
        
        sock.sendto(data, (UDP_IP, UDP_PORT))
        
        print("✅ Mensagem enviada com sucesso!")
        print("🔍 Verifique o listener UDP para ver se recebeu a mensagem")
        
    except Exception as e:
        print(f"❌ Erro ao enviar mensagem: {e}")
    finally:
        sock.close()

if __name__ == "__main__":
    test_udp_connection()
