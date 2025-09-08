#!/usr/bin/env python3
"""
Monitor Gráfico BikeJJ - Análise de Aceleração e Perda de Dados
Gera gráfico em tempo real mostrando performance do sensor Hall
"""

import serial
import time
import matplotlib.pyplot as plt
import matplotlib.animation as animation
from collections import deque
import numpy as np
from datetime import datetime
import threading
import queue

class BikeJJMonitor:
    def __init__(self, port='COM6', baudrate=115200, max_points=100):
        self.port = port
        self.baudrate = baudrate
        self.max_points = max_points
        
        # Dados para o gráfico
        self.times = deque(maxlen=max_points)
        self.pedal_counts = deque(maxlen=max_points)
        self.reading_rates = deque(maxlen=max_points)
        self.lost_pedals = deque(maxlen=max_points)
        
        # Controle
        self.running = True
        self.serial_conn = None
        self.data_queue = queue.Queue()
        
        # Estatísticas
        self.total_pedals = 0
        self.last_pedal_time = 0
        self.current_readings = 0
        self.readings_per_second = 0
        self.last_second_time = time.time()
        self.data_loss_detected = False
        self.estimated_lost = 0
        
        # Configuração do gráfico
        self.setup_plot()
        
    def setup_plot(self):
        """Configura o gráfico matplotlib"""
        plt.style.use('dark_background')
        self.fig, (self.ax1, self.ax2, self.ax3) = plt.subplots(3, 1, figsize=(12, 10))
        self.fig.suptitle('🚴 BikeJJ - Monitor de Performance em Tempo Real', fontsize=16, color='white')
        
        # Gráfico 1: Contagem de Pedaladas
        self.ax1.set_title('📊 Pedaladas por Segundo', color='cyan')
        self.ax1.set_ylabel('Pedaladas/seg', color='cyan')
        self.ax1.grid(True, alpha=0.3)
        self.ax1.set_facecolor('black')
        
        # Gráfico 2: Taxa de Leituras
        self.ax2.set_title('⚡ Leituras do Sensor por Segundo', color='yellow')
        self.ax2.set_ylabel('Leituras/seg', color='yellow')
        self.ax2.grid(True, alpha=0.3)
        self.ax2.set_facecolor('black')
        
        # Gráfico 3: Perda de Dados
        self.ax3.set_title('🚨 Detecção de Perda de Dados', color='red')
        self.ax3.set_ylabel('Pedaladas Perdidas', color='red')
        self.ax3.set_xlabel('Tempo (segundos)', color='white')
        self.ax3.grid(True, alpha=0.3)
        self.ax3.set_facecolor('black')
        
        # Linhas dos gráficos
        self.line1, = self.ax1.plot([], [], 'c-', linewidth=2, label='Pedaladas/seg')
        self.line2, = self.ax2.plot([], [], 'y-', linewidth=2, label='Leituras/seg')
        self.line3, = self.ax3.plot([], [], 'r-', linewidth=2, label='Perdas')
        
        # Configurar eixos
        for ax in [self.ax1, self.ax2, self.ax3]:
            ax.tick_params(colors='white')
            ax.spines['bottom'].set_color('white')
            ax.spines['top'].set_color('white')
            ax.spines['right'].set_color('white')
            ax.spines['left'].set_color('white')
        
        plt.tight_layout()
        
    def connect_serial(self):
        """Conecta na porta serial"""
        try:
            self.serial_conn = serial.Serial(self.port, self.baudrate, timeout=0.1)
            print(f"🔌 Conectado ao Arduino na {self.port} ({self.baudrate} baud)")
            return True
        except Exception as e:
            print(f"❌ Erro ao conectar: {e}")
            return False
    
    def read_serial_data(self):
        """Lê dados da porta serial em thread separada"""
        while self.running:
            if self.serial_conn and self.serial_conn.in_waiting > 0:
                try:
                    line = self.serial_conn.readline().decode('utf-8').strip()
                    if line:
                        self.data_queue.put(line)
                except Exception as e:
                    print(f"❌ Erro na leitura serial: {e}")
            time.sleep(0.001)  # 1ms
    
    def process_data(self, line):
        """Processa uma linha de dados do Arduino"""
        current_time = time.time()
        
        # Processar leitura parcial
        if "📊 J1: Leitura" in line and "parcial" in line:
            self.current_readings += 1
            self.readings_per_second += 1
            
        # Processar pedalada completa
        elif "✅ J1: PEDALADA #" in line:
            self.total_pedals += 1
            self.last_pedal_time = current_time
            
            # Calcular pedaladas por segundo
            if current_time - self.last_second_time >= 1.0:
                pedal_rate = self.total_pedals / (current_time - self.last_second_time)
                self.times.append(current_time)
                self.pedal_counts.append(pedal_rate)
                self.reading_rates.append(self.readings_per_second)
                self.lost_pedals.append(self.estimated_lost)
                
                # Reset contadores
                self.total_pedals = 0
                self.readings_per_second = 0
                self.last_second_time = current_time
                self.estimated_lost = 0
        
        # Detectar perda de dados
        if self.last_pedal_time > 0 and (current_time - self.last_pedal_time) > 2.0:
            if not self.data_loss_detected:
                self.data_loss_detected = True
                print(f"🚨 PERDA DE DADOS DETECTADA em {datetime.now().strftime('%H:%M:%S')}")
            
            # Estimar pedaladas perdidas baseado na velocidade anterior
            if len(self.pedal_counts) > 0:
                last_rate = self.pedal_counts[-1]
                self.estimated_lost += int(last_rate * (current_time - self.last_pedal_time))
        else:
            if self.data_loss_detected:
                print(f"✅ RECUPERADO em {datetime.now().strftime('%H:%M:%S')} (perdeu {self.estimated_lost} pedaladas)")
                self.data_loss_detected = False
                self.estimated_lost = 0
    
    def update_plot(self, frame):
        """Atualiza o gráfico (chamado pelo matplotlib)"""
        # Processar dados da fila
        while not self.data_queue.empty():
            try:
                line = self.data_queue.get_nowait()
                self.process_data(line)
            except queue.Empty:
                break
        
        # Atualizar gráficos se há dados
        if len(self.times) > 1:
            # Converter para arrays numpy
            times_array = np.array(self.times)
            pedal_array = np.array(self.pedal_counts)
            reading_array = np.array(self.reading_rates)
            lost_array = np.array(self.lost_pedals)
            
            # Normalizar tempo (relativo ao início)
            if len(times_array) > 0:
                times_normalized = times_array - times_array[0]
                
                # Atualizar linhas
                self.line1.set_data(times_normalized, pedal_array)
                self.line2.set_data(times_normalized, reading_array)
                self.line3.set_data(times_normalized, lost_array)
                
                # Ajustar eixos
                for ax, data in [(self.ax1, pedal_array), (self.ax2, reading_array), (self.ax3, lost_array)]:
                    if len(data) > 0:
                        ax.set_xlim(0, max(times_normalized) if len(times_normalized) > 0 else 10)
                        ax.set_ylim(0, max(data) * 1.1 if max(data) > 0 else 1)
                
                # Adicionar informações no gráfico
                self.ax1.set_title(f'📊 Pedaladas por Segundo (Total: {sum(pedal_array):.0f})', color='cyan')
                self.ax2.set_title(f'⚡ Leituras por Segundo (Máx: {max(reading_array):.0f})', color='yellow')
                self.ax3.set_title(f'🚨 Perda de Dados (Total Perdido: {sum(lost_array):.0f})', color='red')
        
        return self.line1, self.line2, self.line3
    
    def run(self):
        """Executa o monitor"""
        print("🚴 BikeJJ Monitor Gráfico - Análise de Performance")
        print("=" * 60)
        print("📊 Gráfico 1: Pedaladas por segundo")
        print("⚡ Gráfico 2: Leituras do sensor por segundo") 
        print("🚨 Gráfico 3: Detecção de perda de dados")
        print("=" * 60)
        print("🔄 Iniciando monitoramento...")
        print("⏹️  Pressione Ctrl+C para parar")
        
        if not self.connect_serial():
            return
        
        # Iniciar thread de leitura serial
        serial_thread = threading.Thread(target=self.read_serial_data, daemon=True)
        serial_thread.start()
        
        # Iniciar animação do gráfico
        ani = animation.FuncAnimation(self.fig, self.update_plot, interval=100, blit=False)
        
        try:
            plt.show()
        except KeyboardInterrupt:
            print("\n🛑 Monitor interrompido pelo usuário")
        finally:
            self.running = False
            if self.serial_conn:
                self.serial_conn.close()
            print("🔌 Conexão serial fechada")

if __name__ == "__main__":
    monitor = BikeJJMonitor()
    monitor.run()
