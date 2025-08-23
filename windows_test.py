#!/usr/bin/env python3
"""
Teste específico para Windows - Simula o jogo e identifica problemas
"""
import time
import json
import requests

def test_windows_game():
    print("🪟 Teste Específico para Windows")
    print("=" * 50)
    
    # Simular incremento de energia
    energy = 0
    max_energy = 100
    gain_rate = 3
    
    print(f"📊 Configurações:")
    print(f"   Max Energy: {max_energy} (tipo: {type(max_energy)})")
    print(f"   Gain Rate: {gain_rate} (tipo: {type(gain_rate)})")
    print(f"   Energy inicial: {energy} (tipo: {type(energy)})")
    print()
    
    print("🧪 Simulando incremento de energia...")
    
    for i in range(35):  # Deve chegar a 100+ em 35 iterações
        old_energy = energy
        energy = min(max_energy, energy + gain_rate)
        
        print(f"   Iteração {i+1}: {old_energy} → {energy}/{max_energy}")
        
        # Verificar vitória
        if energy >= max_energy:
            print(f"🏆 VITÓRIA DETECTADA na iteração {i+1}!")
            print(f"   Comparação: {energy} >= {max_energy} = {energy >= max_energy}")
            print(f"   Tipos: energia={type(energy)}, maxEnergy={type(max_energy)}")
            break
        elif i == 34:
            print(f"❌ PROBLEMA: Energia não atingiu máximo após 35 iterações!")
            print(f"   Energia final: {energy}")
            print(f"   Comparação: {energy} >= {max_energy} = {energy >= max_energy}")
    
    print()
    print("🔍 Testando diferentes valores...")
    
    # Testar valores próximos de 100
    test_values = [99.9, 99.99, 99.999, 100.0, 100.1, 100.01]
    
    for value in test_values:
        result = value >= max_energy
        print(f"   {value} >= {max_energy} = {result} (tipos: {type(value)}, {type(max_energy)})")
    
    print()
    print("📡 Testando comunicação com servidor...")
    
    try:
        # Testar se o servidor está respondendo
        response = requests.get('http://localhost:8001/', timeout=5)
        print(f"   ✅ Servidor respondendo: {response.status_code}")
        
        # Testar UDP
        udp_data = {
            "type": "test",
            "player_id": 1,
            "timestamp": int(time.time() * 1000)
        }
        
        udp_response = requests.post('http://localhost:8001/api/udp', 
                                   json=udp_data, 
                                   timeout=5)
        print(f"   ✅ UDP funcionando: {udp_response.status_code}")
        
    except requests.exceptions.ConnectionError:
        print("   ❌ Servidor não está rodando")
    except Exception as e:
        print(f"   ❌ Erro: {e}")
    
    print()
    print("🎯 Recomendações para Windows:")
    print("   1. Verifique se o servidor está rodando")
    print("   2. Abra o console do navegador (F12)")
    print("   3. Acesse /windows_debug.html para testes específicos")
    print("   4. Verifique se há erros JavaScript")
    print("   5. Teste com diferentes navegadores")

if __name__ == "__main__":
    test_windows_game()
