#!/usr/bin/env python3
"""
Monitor Serial para BikeJJ
Monitora a porta serial do ESP32 e exibe as pedaladas em tempo real
"""

import serial
import serial.tools.list_ports
import time
import sys

def list_available_ports():
    """Lista todas as portas seriais disponíveis"""
    ports = serial.tools.list_ports.comports()
    if not ports:
        print("❌ Nenhuma porta serial encontrada!")
        return []
    
    print("🔌 Portas seriais disponíveis:")
    for i, port in enumerate(ports):
        print(f"  {i+1}. {port.device} - {port.description}")
    return ports

def select_port():
    """Permite ao usuário selecionar uma porta"""
    ports = list_available_ports()
    if not ports:
        return None
    
    if len(ports) == 1:
        print(f"✅ Usando única porta disponível: {ports[0].device}")
        return ports[0].device
    
    while True:
        try:
            choice = input(f"\nEscolha uma porta (1-{len(ports)}) ou 'q' para sair: ").strip()
            if choice.lower() == 'q':
                return None
            
            choice_num = int(choice)
            if 1 <= choice_num <= len(ports):
                selected_port = ports[choice_num - 1].device
                print(f"✅ Porta selecionada: {selected_port}")
                return selected_port
            else:
                print("❌ Opção inválida!")
        except ValueError:
            print("❌ Digite um número válido!")

def monitor_serial(port, baudrate=115200):
    """Monitora a porta serial e exibe as mensagens"""
    try:
        print(f"📡 Conectando à porta {port} com baudrate {baudrate}...")
        ser = serial.Serial(port, baudrate, timeout=1)
        print(f"✅ Conectado com sucesso!")
        print(f"🚴 Monitorando pedaladas...")
        print(f"📊 Formato esperado: 'Pedaladas: X' e 'Pedalada: True/False'")
        print(f"🔍 Pressione Ctrl+C para parar\n")
        
        # Aguardar estabilização
        time.sleep(2)
        
        pedal_count = 0
        last_pedal_state = None
        
        while True:
            if ser.in_waiting:
                try:
                    line = ser.readline().decode('utf-8').strip()
                    if line:
                        # Processar linha do ESP32
                        if line.startswith("Pedaladas:"):
                            try:
                                count_str = line.split(":")[1].strip()
                                new_count = int(count_str)
                                if new_count != pedal_count:
                                    pedal_count = new_count
                                    print(f"🚴 Pedaladas: {pedal_count}")
                            except:
                                print(f"📡 {line}")
                        elif line.startswith("Pedalada:"):
                            try:
                                state_str = line.split(":")[1].strip()
                                pedal_state = (state_str == "True")
                                
                                if pedal_state != last_pedal_state:
                                    last_pedal_state = pedal_state
                                    if pedal_state:
                                        print(f"⚡ PEDALADA DETECTADA! (Total: {pedal_count})")
                                    else:
                                        print(f"🛑 Parou de pedalar")
                                else:
                                    print(f"📡 {line}")
                            except:
                                print(f"📡 {line}")
                        elif "Interrupção:" in line:
                            print(f"🔍 {line}")
                        elif "✅" in line or "🛑" in line:
                            print(f"📡 {line}")
                        else:
                            print(f"📡 {line}")
                except UnicodeDecodeError:
                    print(f"⚠️ Erro de decodificação na linha serial")
                except Exception as e:
                    print(f"❌ Erro ao processar linha: {e}")
            
            time.sleep(0.01)  # 10ms delay
            
    except serial.SerialException as e:
        print(f"❌ Erro de conexão serial: {e}")
        print(f"💡 Verifique se:")
        print(f"   - O ESP32 está conectado")
        print(f"   - A porta está correta")
        print(f"   - Nenhum outro programa está usando a porta")
    except KeyboardInterrupt:
        print(f"\n🛑 Monitoramento interrompido pelo usuário")
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")
    finally:
        if 'ser' in locals() and ser.is_open:
            ser.close()
            print(f"🔌 Conexão serial fechada")

def main():
    print("🚴 BikeJJ - Monitor Serial")
    print("=" * 40)
    
    # Listar portas disponíveis
    ports = list_available_ports()
    if not ports:
        print("💡 Conecte o ESP32 e tente novamente")
        return
    
    # Selecionar porta
    selected_port = select_port()
    if not selected_port:
        print("👋 Saindo...")
        return
    
    # Configurar baudrate
    baudrate = 115200
    print(f"⚙️ Baudrate: {baudrate}")
    
    # Iniciar monitoramento
    monitor_serial(selected_port, baudrate)

if __name__ == "__main__":
    main()
