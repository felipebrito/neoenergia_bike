#!/usr/bin/env python3
"""
Script para fazer upload do firmware otimizado para Arduino Mega
Porta: COM6
Firmware: arduino_mega_bike_optimized.ino
"""

import subprocess
import sys
import os

def check_arduino_cli():
    """Verificar se arduino-cli está disponível"""
    try:
        result = subprocess.run(['arduino-cli', 'version'], 
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            print("✅ Arduino CLI encontrado")
            return True
    except (subprocess.TimeoutExpired, FileNotFoundError):
        pass
    
    print("❌ Arduino CLI não encontrado")
    return False

def compile_firmware():
    """Compilar o firmware"""
    print("🔨 Compilando firmware...")
    try:
        result = subprocess.run([
            'arduino-cli', 'compile', 
            '--fqbn', 'arduino:avr:mega',
            'arduino_mega_bike_optimized.ino'
        ], capture_output=True, text=True, timeout=60)
        
        if result.returncode == 0:
            print("✅ Compilação bem-sucedida")
            return True
        else:
            print(f"❌ Erro na compilação: {result.stderr}")
            return False
    except subprocess.TimeoutExpired:
        print("❌ Timeout na compilação")
        return False
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False

def upload_firmware():
    """Fazer upload do firmware"""
    print("📤 Fazendo upload para COM6...")
    try:
        result = subprocess.run([
            'arduino-cli', 'upload', 
            '-p', 'COM6',
            '--fqbn', 'arduino:avr:mega',
            'arduino_mega_bike_optimized.ino'
        ], capture_output=True, text=True, timeout=120)
        
        if result.returncode == 0:
            print("✅ Upload bem-sucedido!")
            print("🚴 Firmware otimizado instalado no Arduino Mega")
            print("⚙️ Configuração padrão: 6 leituras = 1 pedalada")
            return True
        else:
            print(f"❌ Erro no upload: {result.stderr}")
            return False
    except subprocess.TimeoutExpired:
        print("❌ Timeout no upload")
        return False
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False

def main():
    print("🚀 Upload do Firmware BikeJJ Otimizado")
    print("=" * 50)
    
    # Verificar se o arquivo existe
    if not os.path.exists('arduino_mega_bike_optimized.ino'):
        print("❌ Arquivo arduino_mega_bike_optimized.ino não encontrado")
        return False
    
    # Verificar Arduino CLI
    if not check_arduino_cli():
        print("💡 Instale o Arduino CLI ou use o Arduino IDE manualmente")
        print("   https://arduino.github.io/arduino-cli/")
        return False
    
    # Compilar
    if not compile_firmware():
        return False
    
    # Upload
    if not upload_firmware():
        return False
    
    print("\n🎉 FIRMWARE INSTALADO COM SUCESSO!")
    print("📊 Configuração padrão: 6 leituras = 1 pedalada")
    print("🔧 Para ajustar: Abra Serial Monitor e digite 'J1:10' (exemplo)")
    print("📈 Para monitorar: Digite 'STATUS' no Serial Monitor")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
