#!/usr/bin/env python3
"""
Monitor Ultra Otimizado para BikeJJ
Versão: Ultra Otimizada para Alta Velocidade
"""

import serial
import time
import threading
from datetime import datetime

class UltraSerialMonitor:
    def __init__(self, port='COM6', baudrate=115200):
        self.port = port
        self.baudrate = baudrate
        self.serial_conn = None
        self.running = False
        self.data_buffer = []
        self.stats = {
            'total_lines': 0,
            'pedaladas_detectadas': 0,
            'leituras_perdidas': 0,
            'max_leituras_por_segundo': 0,
            'start_time': None
        }
        
    def connect(self):
        try:
            self.serial_conn = serial.Serial(
                port=self.port,
                baudrate=self.baudrate,
                timeout=0.1,
                write_timeout=1
            )
            print(f"🔌 Conectado à porta {self.port} @ {self.baudrate} baud")
            return True
        except Exception as e:
            print(f"❌ Erro ao conectar: {e}")
            return False
    
    def start_monitoring(self):
        if not self.connect():
            return
        
        self.running = True
        self.stats['start_time'] = time.time()
        
        print("🚴 BikeJJ Ultra Monitor - Iniciado")
        print("📊 Monitorando dados em tempo real...")
        print("⚡ Otimizado para alta velocidade")
        print("=" * 60)
        
        try:
            while self.running:
                if self.serial_conn.in_waiting > 0:
                    line = self.serial_conn.readline().decode('utf-8', errors='ignore').strip()
                    if line:
                        self.process_line(line)
                else:
                    time.sleep(0.001)  # 1ms sleep para alta performance
                    
        except KeyboardInterrupt:
            print("\n🛑 Monitor interrompido pelo usuário")
        except Exception as e:
            print(f"❌ Erro durante monitoramento: {e}")
        finally:
            self.stop_monitoring()
    
    def process_line(self, line):
        self.stats['total_lines'] += 1
        self.data_buffer.append(line)
        
        # Manter apenas últimos 1000 registros
        if len(self.data_buffer) > 1000:
            self.data_buffer = self.data_buffer[-1000:]
        
        # Processar diferentes tipos de mensagens
        if "Pedalada #" in line and "detectada" in line:
            self.stats['pedaladas_detectadas'] += 1
            print(f"✅ {line}")
            
        elif "Resetando contador após inatividade" in line:
            self.stats['leituras_perdidas'] += 1
            print(f"⚠️  {line}")
            
        elif "Leituras/segundo" in line:
            # Extrair valores de leituras por segundo
            try:
                parts = line.split(": ")
                if len(parts) > 1:
                    readings = parts[1].split(", ")
                    for reading in readings:
                        if "J" in reading and ":" in reading:
                            player_reading = reading.split(":")[1]
                            if player_reading.isdigit():
                                current_reading = int(player_reading)
                                if current_reading > self.stats['max_leituras_por_segundo']:
                                    self.stats['max_leituras_por_segundo'] = current_reading
            except:
                pass
            print(f"📈 {line}")
            
        elif "Leitura" in line and "parcial" in line:
            # Mostrar progresso das leituras
            print(f"📊 {line}")
            
        else:
            print(f"📨 {line}")
    
    def stop_monitoring(self):
        self.running = False
        if self.serial_conn:
            self.serial_conn.close()
        
        # Mostrar estatísticas finais
        self.show_final_stats()
    
    def show_final_stats(self):
        if self.stats['start_time']:
            duration = time.time() - self.stats['start_time']
            print("\n" + "=" * 60)
            print("📊 ESTATÍSTICAS FINAIS")
            print("=" * 60)
            print(f"⏱️  Tempo de monitoramento: {duration:.1f} segundos")
            print(f"📨 Total de linhas processadas: {self.stats['total_lines']}")
            print(f"✅ Pedaladas detectadas: {self.stats['pedaladas_detectadas']}")
            print(f"⚠️  Leituras perdidas: {self.stats['leituras_perdidas']}")
            print(f"🚀 Máximo de leituras/segundo: {self.stats['max_leituras_por_segundo']}")
            
            if duration > 0:
                avg_lines_per_second = self.stats['total_lines'] / duration
                print(f"📈 Média de linhas/segundo: {avg_lines_per_second:.1f}")
            
            # Calcular eficiência
            if self.stats['pedaladas_detectadas'] > 0:
                efficiency = (self.stats['pedaladas_detectadas'] / 
                            (self.stats['pedaladas_detectadas'] + self.stats['leituras_perdidas'])) * 100
                print(f"🎯 Eficiência: {efficiency:.1f}%")
            
            print("=" * 60)

def main():
    monitor = UltraSerialMonitor()
    
    print("🚴 BikeJJ Ultra Monitor")
    print("📡 Conectando à porta serial...")
    
    try:
        monitor.start_monitoring()
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    main()
