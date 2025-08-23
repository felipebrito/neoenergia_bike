#!/usr/bin/env python3
"""
Teste específico para enviar mensagens no formato "Lines" para o Aparato
"""

import socket
import time

def test_aparato_lines():
    """Testar envio UDP no formato Lines para o Aparato na porta 8888"""
    
    # Configurações para o Aparato
    UDP_IP = "127.0.0.1"
    UDP_PORT = 8888  # Porta do Aparato
    
    # Criar socket UDP
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    
    try:
        print(f"📤 Testando envio para Aparato em {UDP_IP}:{UDP_PORT}")
        print("📝 Formato: Lines (não JSON)")
        print("=" * 50)
        
        # Teste 1: Mensagem de vencedor no formato Lines
        winner_message = f"winner 3 {int(time.time())}"
        
        print(f"🏆 Enviando mensagem de vencedor (formato Lines):")
        print(f"   Mensagem: {winner_message}")
        print(f"   Tamanho: {len(winner_message)} bytes")
        
        data = winner_message.encode('utf-8')
        sock.sendto(data, (UDP_IP, UDP_PORT))
        print(f"✅ Mensagem enviada para {UDP_IP}:{UDP_PORT}")
        
        # Aguardar um pouco
        time.sleep(2)
        
        # Teste 2: Mensagem de reset no formato Lines
        reset_message = f"reset 0 {int(time.time())}"
        
        print(f"\n🔄 Enviando mensagem de reset (formato Lines):")
        print(f"   Mensagem: {reset_message}")
        print(f"   Tamanho: {len(reset_message)} bytes")
        
        data = reset_message.encode('utf-8')
        sock.sendto(data, (UDP_IP, UDP_PORT))
        print(f"✅ Mensagem enviada para {UDP_IP}:{UDP_PORT}")
        
        print(f"\n🎯 Verifique o Aparato para ver se recebeu as mensagens!")
        print(f"📡 Porta de destino: {UDP_PORT}")
        print(f"📝 Formato: Lines (space-separated)")
        
    except Exception as e:
        print(f"❌ Erro ao enviar mensagem: {e}")
    finally:
        sock.close()

if __name__ == "__main__":
    test_aparato_lines()
