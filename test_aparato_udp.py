#!/usr/bin/env python3
"""
Teste específico para enviar mensagens para o Aparato na porta 8888
"""

import socket
import json
import time

def test_aparato_udp():
    """Testar envio UDP para o Aparato na porta 8888"""
    
    # Configurações para o Aparato
    UDP_IP = "127.0.0.1"
    UDP_PORT = 8888  # Porta do Aparato
    
    # Criar socket UDP
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    
    try:
        print(f"📤 Testando envio para Aparato em {UDP_IP}:{UDP_PORT}")
        print("=" * 50)
        
        # Teste 1: Mensagem de vencedor
        winner_message = {
            "type": "winner",
            "player_id": 3,
            "timestamp": time.time(),
            "game": "BikeJJ",
            "message": "Jogador 3 venceu a competição!"
        }
        
        json_data = json.dumps(winner_message)
        data = json_data.encode('utf-8')
        
        print(f"🏆 Enviando mensagem de vencedor:")
        print(f"   JSON: {json_data}")
        print(f"   Tamanho: {len(data)} bytes")
        
        sock.sendto(data, (UDP_IP, UDP_PORT))
        print(f"✅ Mensagem enviada para {UDP_IP}:{UDP_PORT}")
        
        # Aguardar um pouco
        time.sleep(2)
        
        # Teste 2: Mensagem de reset
        reset_message = {
            "type": "reset",
            "player_id": 0,
            "timestamp": time.time(),
            "game": "BikeJJ",
            "message": "Jogo reiniciado"
        }
        
        json_data = json.dumps(reset_message)
        data = json_data.encode('utf-8')
        
        print(f"\n🔄 Enviando mensagem de reset:")
        print(f"   JSON: {json_data}")
        print(f"   Tamanho: {len(data)} bytes")
        
        sock.sendto(data, (UDP_IP, UDP_PORT))
        print(f"✅ Mensagem enviada para {UDP_IP}:{UDP_PORT}")
        
        print(f"\n🎯 Verifique o Aparato para ver se recebeu as mensagens!")
        print(f"📡 Porta de destino: {UDP_PORT}")
        
    except Exception as e:
        print(f"❌ Erro ao enviar mensagem: {e}")
    finally:
        sock.close()

if __name__ == "__main__":
    test_aparato_udp()
