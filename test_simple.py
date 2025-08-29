#!/usr/bin/env python3
"""
Teste simples para BikeJJ - Simula dados do Arduino
"""

import time
import requests
import json

def test_player_detection():
    """Testar se cada jogador está sendo detectado corretamente"""
    
    base_url = "http://localhost:9000"
    
    print("🚀 TESTE BikeJJ - Detecção de Jogadores")
    print("=" * 50)
    
    # 1. Verificar estado inicial
    print("\n1️⃣ Estado inicial do jogo:")
    try:
        response = requests.get(f"{base_url}/api/state")
        state = response.json()
        print(f"   Jogo ativo: {state['game_active']}")
        print(f"   Jogadores prontos: {state['players_ready']}")
        print(f"   Pode iniciar: {state['game_can_start']}")
        print(f"   Energias: [{state['player1_energy']}, {state['player2_energy']}, {state['player3_energy']}, {state['player4_energy']}]")
    except Exception as e:
        print(f"❌ Erro: {e}")
        return
    
    # 2. Tentar iniciar jogo sem jogadores prontos
    print("\n2️⃣ Tentando iniciar jogo SEM jogadores prontos:")
    try:
        response = requests.get(f"{base_url}/api/start-game")
        if response.status_code == 400:
            result = response.json()
            print(f"   ✅ Bloqueou corretamente: {result['message']}")
        else:
            print(f"   ❌ Deveria ter bloqueado, mas não bloqueou")
    except Exception as e:
        print(f"❌ Erro: {e}")
    
    # 3. Simular que seria necessário ter Arduino conectado
    print("\n3️⃣ SIMULAÇÃO: Como seria com Arduino conectado")
    print("   📱 Conecte o Arduino Mega")
    print("   🔌 Configure a porta serial em: http://localhost:9000/serial_config.html")
    print("   🚴 Cada jogador deve dar pelo menos UMA pedalada")
    print("   ✅ Quando todos pedalarem, aparecerá: 'TODOS OS JOGADORES ESTÃO PRONTOS!'")
    print("   🎮 Aí sim o jogo poderá ser iniciado")
    
    # 4. Mostrar como monitorar o progresso
    print("\n4️⃣ Para monitorar o progresso em tempo real:")
    print("   📊 Acesse: http://localhost:9000")
    print("   👁️ Observe o console do servidor para ver:")
    print("      - ✅ Jogador X: PRIMEIRA PEDALADA - Marcado como PRONTO!")
    print("      - 📊 Progresso: X/4 jogadores prontos")
    print("      - 🎮 TODOS OS JOGADORES ESTÃO PRONTOS!")
    
    # 5. Testar estado atual
    print("\n5️⃣ Estado atual (monitorar em tempo real):")
    for i in range(5):
        try:
            response = requests.get(f"{base_url}/api/state")
            state = response.json()
            ready_count = sum(state['players_ready'])
            energias = [state[f'player{i+1}_energy'] for i in range(4)]
            
            print(f"   ⏰ {time.strftime('%H:%M:%S')} - Prontos: {ready_count}/4, Energias: {energias}")
            time.sleep(2)
        except Exception as e:
            print(f"❌ Erro: {e}")
            break
    
    print("\n✅ Teste concluído!")
    print("💡 Agora conecte o Arduino e veja os jogadores ficando prontos!")

if __name__ == "__main__":
    test_player_detection()
