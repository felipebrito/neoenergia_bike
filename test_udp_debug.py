#!/usr/bin/env python3
"""
Debug UDP - Testar diferentes formatos para identificar o problema
"""

import socket
import json
import time

def test_udp_formats():
    """Testar diferentes formatos UDP"""
    
    UDP_IP = "127.0.0.1"
    UDP_PORT = 8888  # Porta do Aparato
    
    # Criar socket UDP
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    
    try:
        print(f"🔍 Debug UDP - Testando diferentes formatos")
        print(f"📡 Destino: {UDP_IP}:{UDP_PORT}")
        print("=" * 60)
        
        # Teste 1: JSON completo
        json_message = {
            "type": "winner",
            "player_id": 1,
            "timestamp": time.time(),
            "game": "BikeJJ"
        }
        json_data = json.dumps(json_message)
        
        print(f"📤 Teste 1: JSON completo")
        print(f"   Conteúdo: {json_data}")
        print(f"   Tamanho: {len(json_data)} bytes")
        
        sock.sendto(json_data.encode('utf-8'), (UDP_IP, UDP_PORT))
        print(f"   ✅ Enviado")
        time.sleep(1)
        
        # Teste 2: JSON simples
        json_simple = {
            "type": "winner",
            "player_id": 2
        }
        json_data_simple = json.dumps(json_simple)
        
        print(f"\n📤 Teste 2: JSON simples")
        print(f"   Conteúdo: {json_data_simple}")
        print(f"   Tamanho: {len(json_data_simple)} bytes")
        
        sock.sendto(json_data_simple.encode('utf-8'), (UDP_IP, UDP_PORT))
        print(f"   ✅ Enviado")
        time.sleep(1)
        
        # Teste 3: Linha simples
        line_message = "winner 3"
        
        print(f"\n📤 Teste 3: Linha simples")
        print(f"   Conteúdo: {line_message}")
        print(f"   Tamanho: {len(line_message)} bytes")
        
        sock.sendto(line_message.encode('utf-8'), (UDP_IP, UDP_PORT))
        print(f"   ✅ Enviado")
        time.sleep(1)
        
        # Teste 4: Reset
        reset_message = {
            "type": "reset",
            "player_id": 0
        }
        reset_data = json.dumps(reset_message)
        
        print(f"\n📤 Teste 4: Reset")
        print(f"   Conteúdo: {reset_data}")
        print(f"   Tamanho: {len(reset_data)} bytes")
        
        sock.sendto(reset_data.encode('utf-8'), (UDP_IP, UDP_PORT))
        print(f"   ✅ Enviado")
        
        print(f"\n🎯 Verifique o Aparato para ver qual formato funciona!")
        print(f"📝 Dica: Configure o protocolo para 'JSON' no Aparato")
        
    except Exception as e:
        print(f"❌ Erro: {e}")
    finally:
        sock.close()

if __name__ == "__main__":
    test_udp_formats()
