#!/usr/bin/env python3
"""
Servidor WebSocket para BikeJJ
Comunicação em tempo real entre ESP32 e browser
"""

import asyncio
import websockets
import json
import serial
import threading
import time
from collections import deque

# Configurações
SERIAL_PORT = '/dev/cu.usbserial-2130'
SERIAL_BAUDRATE = 115200
ENERGY_PER_PEDAL = 3.0

# Clientes WebSocket conectados
connected_clients = set()

# Estado do jogo
game_state = {
    'player1_energy': 0,
    'game_active': False,
    'pedal_count': 0
}

class ESP32Reader:
    def __init__(self):
        self.serial_conn = None
        self.running = False
        self.last_pedal_time = 0
        self.debounce_time = 500  # 500ms
        
    def start(self):
        try:
            self.serial_conn = serial.Serial(SERIAL_PORT, SERIAL_BAUDRATE, timeout=1)
            self.running = True
            print(f"📡 Conectado ao ESP32 na porta {SERIAL_PORT}")
            
            # Thread de leitura serial
            self.read_thread = threading.Thread(target=self._read_serial, daemon=True)
            self.read_thread.start()
            
        except Exception as e:
            print(f"❌ Erro ao conectar com ESP32: {e}")
    
    def stop(self):
        self.running = False
        if self.serial_conn:
            self.serial_conn.close()
    
    def _read_serial(self):
        while self.running:
            try:
                if self.serial_conn and self.serial_conn.in_waiting:
                    line = self.serial_conn.readline().decode('utf-8').strip()
                    self._process_line(line)
                time.sleep(0.01)
            except Exception as e:
                print(f"❌ Erro na leitura serial: {e}")
                time.sleep(1)
    
    def _process_line(self, line):
        if not line:
            return
            
        if line.startswith("Pedaladas:"):
            try:
                count_str = line.split(":")[1].strip()
                game_state['pedal_count'] = int(count_str)
            except:
                pass
                
        elif line.startswith("Pedalada:"):
            try:
                state_str = line.split(":")[1].strip()
                pedal_detected = (state_str == "True")
                current_time = time.time() * 1000
                
                if pedal_detected:
                    # Debounce simples
                    if (self.last_pedal_time == 0 or (current_time - self.last_pedal_time) > self.debounce_time):
                        self.last_pedal_time = current_time
                        self._handle_pedal()
                else:
                    # Parou de pedalar
                    if game_state['game_active']:
                        self._send_to_clients({
                            'type': 'stop_pedaling',
                            'player_id': 1
                        })
                        
            except Exception as e:
                print(f"❌ Erro: {e}")
    
    def _handle_pedal(self):
        if game_state['game_active']:
            # Incrementar energia
            old_energy = game_state['player1_energy']
            game_state['player1_energy'] += ENERGY_PER_PEDAL
            
            # Limitar a 100%
            if game_state['player1_energy'] > 100:
                game_state['player1_energy'] = 100
            
            print(f"🚴 PEDALADA #{game_state['pedal_count']} - Energia: {old_energy:.1f}% → {game_state['player1_energy']:.1f}%")
            
            # Enviar para todos os clientes WebSocket
            self._send_to_clients({
                'type': 'pedal_energy',
                'player_id': 1,
                'energy': game_state['player1_energy'],
                'pedal_count': game_state['pedal_count']
            })
            
            # Verificar vitória
            if game_state['player1_energy'] >= 100:
                self._send_to_clients({
                    'type': 'winner',
                    'player_id': 1
                })
                game_state['game_active'] = False
    
    def _send_to_clients(self, message):
        """Envia mensagem para todos os clientes WebSocket conectados"""
        if connected_clients:
            asyncio.run(self._broadcast(message))
    
    async def _broadcast(self, message):
        """Broadcast para todos os clientes"""
        if connected_clients:
            message_str = json.dumps(message)
            await asyncio.gather(
                *[client.send(message_str) for client in connected_clients],
                return_exceptions=True
            )

# Instância global do leitor ESP32
esp32_reader = ESP32Reader()

async def websocket_handler(websocket, path):
    """Handler para conexões WebSocket"""
    print(f"🔌 Novo cliente WebSocket conectado")
    connected_clients.add(websocket)
    
    try:
        # Enviar estado atual
        await websocket.send(json.dumps({
            'type': 'game_state',
            'data': game_state
        }))
        
        # Manter conexão ativa
        async for message in websocket:
            try:
                data = json.loads(message)
                
                if data['type'] == 'start_game':
                    game_state['game_active'] = True
                    game_state['player1_energy'] = 0
                    print("🎮 Jogo iniciado")
                    
                elif data['type'] == 'reset_game':
                    game_state['game_active'] = False
                    game_state['player1_energy'] = 0
                    print("🔄 Jogo resetado")
                    
                # Broadcast para outros clientes
                await broadcast_to_others(websocket, data)
                
            except json.JSONDecodeError:
                print(f"❌ Mensagem inválida: {message}")
                
    except websockets.exceptions.ConnectionClosed:
        print("🔌 Cliente WebSocket desconectado")
    finally:
        connected_clients.remove(websocket)

async def broadcast_to_others(sender, message):
    """Envia mensagem para outros clientes (não para o remetente)"""
    if connected_clients:
        message_str = json.dumps(message)
        await asyncio.gather(
            *[client.send(message_str) for client in connected_clients if client != sender],
            return_exceptions=True
        )

async def main():
    """Função principal"""
    print("🚀 Iniciando servidor WebSocket BikeJJ...")
    
    # Iniciar leitor ESP32
    esp32_reader.start()
    
    # Servidor WebSocket
    server = await websockets.serve(
        websocket_handler, 
        "localhost", 
        9003
    )
    
    print("✅ Servidor WebSocket rodando em ws://localhost:9003")
    print("🌐 Acesse: http://localhost:9003")
    
    try:
        await asyncio.Future()  # Manter servidor rodando
    except KeyboardInterrupt:
        print("\n🛑 Parando servidor...")
        esp32_reader.stop()
        server.close()
        await server.wait_closed()

if __name__ == "__main__":
    asyncio.run(main())
