#!/usr/bin/env python3
"""
Teste SIMPLES para Windows - Sem dependências externas
"""
import time
import math

def test_windows_simple():
    print("🪟 Teste SIMPLES para Windows (Sem dependências)")
    print("=" * 60)
    
    # Simular incremento de energia
    energy = 0.0
    max_energy = 100.0
    gain_rate = 3.0
    
    print(f"📊 Configurações:")
    print(f"   Max Energy: {max_energy} (tipo: {type(max_energy)})")
    print(f"   Gain Rate: {gain_rate} (tipo: {type(gain_rate)})")
    print(f"   Energy inicial: {energy} (tipo: {type(energy)})")
    print()
    
    print("🧪 Simulando incremento de energia...")
    
    for i in range(35):  # Deve chegar a 100+ em 35 iterações
        old_energy = energy
        energy = min(max_energy, energy + gain_rate)
        
        print(f"   Iteração {i+1:2d}: {old_energy:6.3f} → {energy:6.3f}/{max_energy}")
        
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
        print(f"   {value:6.3f} >= {max_energy:6.3f} = {result} (tipos: {type(value)}, {type(max_energy)})")
    
    print()
    print("🔢 Testando precisão float...")
    
    # Testar precisão
    float_test = 0.1 + 0.2
    print(f"   0.1 + 0.2 = {float_test}")
    print(f"   0.1 + 0.2 == 0.3 = {float_test == 0.3}")
    print(f"   abs(0.1 + 0.2 - 0.3) < 0.0001 = {abs(float_test - 0.3) < 0.0001}")
    
    print()
    print("🎯 Recomendações para Windows:")
    print("   1. Verifique se o servidor está rodando (python3 server.py)")
    print("   2. Abra o console do navegador (F12)")
    print("   3. Acesse /windows_debug.html para testes específicos")
    print("   4. Verifique se há erros JavaScript")
    print("   5. Teste com diferentes navegadores")
    print("   6. Execute este script para verificar lógica básica")

if __name__ == "__main__":
    test_windows_simple()
