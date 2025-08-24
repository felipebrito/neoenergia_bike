#!/usr/bin/env python3
"""
Simulador da ESP32 para BikeJJ
Envia dados dos sensores via HTTP (sem necessidade de porta serial)
"""
import time
import random
import threading
import json
import urllib.request
import urllib.error

class ESP32Simulator:
    def __init__(self, server_url='http://localhost:8002'):
        self.server_url = server_url
        self.is_running = False
        self.last_states = {1: 0, 2: 0, 3: 0, 4: 0}  # Estado anterior de cada jogador
        
    def send_key_command(self, player_id, action):
        """Enviar comando de tecla para o servidor"""
        try:
            # Mapear jogador para tecla
            key_map = {1: 'KeyQ', 2: 'KeyW', 3: 'KeyE', 4: 'KeyR'}
            key = key_map.get(player_id)
            
            if key:
                # Enviar comando para o servidor HTTP
                data = {
                    'type': 'key_command',
                    'player_id': player_id,
                    'key': key,
                    'action': action,
                    'timestamp': time.time()
                }
                
                # Enviar para o servidor local
                url = f'{self.server_url}/api/key'
                req = urllib.request.Request(url, 
                                          data=json.dumps(data).encode('utf-8'),
                                          headers={'Content-Type': 'application/json'})
                
                try:
                    with urllib.request.urlopen(req) as response:
                        print(f"✅ Comando enviado: {action} {key} para Jogador {player_id}")
                except urllib.error.URLError as e:
                    print(f"⚠️ Servidor não respondeu: {e}")
                    
        except Exception as e:
            print(f"❌ Erro ao enviar comando: {e}")
    
    def simulate_ultra_aggressive_game(self):
        """Simular uma partida ultra-agressiva onde alguém vai ganhar rapidamente"""
        print("🏁 Iniciando partida ULTRA-AGRESSIVA!")
        
        # Fase 1: Todos começam a pedalar simultaneamente
        for player_id in range(1, 5):
            self.send_key_command(player_id, 'keydown')
            self.last_states[player_id] = 1
            print(f"🚴 Jogador {player_id} começou a pedalar")
            time.sleep(0.05)  # Muito rápido
        
        # Fase 2: Competição ULTRA intensa
        game_duration = 15  # 15 segundos (muito mais rápido)
        start_time = time.time()
        
        while self.is_running and (time.time() - start_time) < game_duration:
            try:
                # Simular pedaladas ULTRA intensas
                for player_id in range(1, 5):
                    # 95% de chance de continuar pedalando (quase sempre pedalando)
                    if random.random() < 0.95:
                        if self.last_states[player_id] == 0:
                            self.send_key_command(player_id, 'keydown')
                            self.last_states[player_id] = 1
                            print(f"🚴 Jogador {player_id} voltou a pedalar")
                    
                    # Apenas 5% de chance de parar (muito raro)
                    elif self.last_states[player_id] == 1 and random.random() < 0.05:
                        self.send_key_command(player_id, 'keyup')
                        self.last_states[player_id] = 0
                        print(f"🛑 Jogador {player_id} parou temporariamente")
                
                # Ciclo ULTRA rápido para acumular energia rapidamente
                time.sleep(0.1)  # Apenas 0.1 segundos entre ciclos
                
            except Exception as e:
                print(f"❌ Erro na partida: {e}")
                break
        
        # Fase 3: Final da partida
        print("🏁 Finalizando partida ULTRA-AGRESSIVA...")
        for player_id in range(1, 5):
            if self.last_states[player_id] == 1:
                self.send_key_command(player_id, 'keyup')
                self.last_states[player_id] = 0
                print(f"🛑 Jogador {player_id} parou de pedalar")
        
        print("✅ Partida ULTRA-AGRESSIVA concluída!")
    
    def start_new_game(self):
        """Enviar comando para iniciar nova partida"""
        try:
            print("🔄 Enviando comando para iniciar nova partida...")
            
            # Enviar comando para o endpoint de nova partida
            data = {
                'type': 'new_game',
                'timestamp': time.time()
            }
            
            url = f'{self.server_url}/api/new-game'
            req = urllib.request.Request(url, 
                                      data=json.dumps(data).encode('utf-8'),
                                      headers={'Content-Type': 'application/json'})
            
            try:
                with urllib.request.urlopen(req) as response:
                    print("✅ Comando de nova partida enviado com sucesso!")
            except urllib.error.URLError as e:
                print(f"⚠️ Servidor não respondeu: {e}")
                
        except Exception as e:
            print(f"❌ Erro ao iniciar nova partida: {e}")
    
    def simulate_quick_game(self):
        """Simular uma partida rápida e intensa"""
        print("🏁 Iniciando partida rápida simulada!")
        
        # Fase 1: Todos começam a pedalar
        for player_id in range(1, 5):
            self.send_key_command(player_id, 'keydown')
            self.last_states[player_id] = 1
            print(f"🚴 Jogador {player_id} começou a pedalar")
            time.sleep(0.1)
        
        # Fase 2: Competição intensa
        game_duration = 30  # 30 segundos de partida
        start_time = time.time()
        
        while self.is_running and (time.time() - start_time) < game_duration:
            try:
                # Simular pedaladas intensas e coordenadas
                for player_id in range(1, 5):
                    # 90% de chance de continuar pedalando
                    if random.random() < 0.9:
                        if self.last_states[player_id] == 0:
                            self.send_key_command(player_id, 'keydown')
                            self.last_states[player_id] = 1
                            print(f"🚴 Jogador {player_id} voltou a pedalar")
                    
                    # 15% de chance de parar temporariamente
                    elif self.last_states[player_id] == 1 and random.random() < 0.15:
                        self.send_key_command(player_id, 'keyup')
                        self.last_states[player_id] = 0
                        print(f"🛑 Jogador {player_id} parou temporariamente")
                
                # Ciclo muito rápido para acumular energia
                time.sleep(0.2)
                
            except Exception as e:
                print(f"❌ Erro na partida: {e}")
                break
        
        # Fase 3: Final da partida
        print("🏁 Finalizando partida simulada...")
        for player_id in range(1, 5):
            if self.last_states[player_id] == 1:
                self.send_key_command(player_id, 'keyup')
                self.last_states[player_id] = 0
                print(f"🛑 Jogador {player_id} parou de pedalar")
        
        print("✅ Partida simulada concluída!")
    
    def simulate_pedaling(self):
        """Simular pedaladas dos jogadores de forma mais agressiva"""
        while self.is_running:
            try:
                # Simular pedaladas mais frequentes e coordenadas
                for player_id in range(1, 5):
                    # 80% de chance de pedalar a cada ciclo (muito mais agressivo)
                    if random.random() < 0.8:
                        # Simular início da pedalada
                        if self.last_states[player_id] == 0:
                            self.send_key_command(player_id, 'keydown')
                            self.last_states[player_id] = 1
                            print(f"🚴 Jogador {player_id} começou a pedalar")
                        
                        # Manter pedalando por mais tempo
                        time.sleep(0.1)  # Pausa menor
                        
                        # 20% de chance de parar (menor chance de parar)
                        if random.random() < 0.2:
                            self.send_key_command(player_id, 'keyup')
                            self.last_states[player_id] = 0
                            print(f"🛑 Jogador {player_id} parou de pedalar")
                
                # Ciclo mais rápido para acumular energia rapidamente
                time.sleep(0.3)  # Aguardar apenas 0.3 segundos entre ciclos
                
            except Exception as e:
                print(f"❌ Erro na simulação: {e}")
                break
    
    def start(self, mode='continuous'):
        """Iniciar simulador"""
        self.is_running = True
        print("🚀 Simulador ESP32 iniciado!")
        print("📊 Enviando dados dos sensores via HTTP...")
        print(f"🌐 Servidor: {self.server_url}")
        
        if mode == 'ultra_aggressive':
            print("🏁 Modo: Partida ULTRA-AGRESSIVA (15 segundos)")
            # Thread para partida ultra-agressiva
            game_thread = threading.Thread(target=self.simulate_ultra_aggressive_game, daemon=True)
            game_thread.start()
        elif mode == 'quick_game':
            print("🏁 Modo: Partida Rápida (30 segundos)")
            # Thread para partida rápida
            game_thread = threading.Thread(target=self.simulate_quick_game, daemon=True)
            game_thread.start()
        else:
            print("🔄 Modo: Simulação Contínua")
            # Thread para simulação contínua
            pedal_thread = threading.Thread(target=self.simulate_pedaling, daemon=True)
            pedal_thread.start()
        
        return True
    
    def stop(self):
        """Parar simulador"""
        self.is_running = False
        print("🛑 Simulador ESP32 parado")

def main():
    print("🎮 Simulador ESP32 para BikeJJ")
    print("=" * 40)
    
    # Configurações
    server_url = 'http://localhost:8002'
    
    print(f"🔌 Conectando ao servidor: {server_url}")
    
    # Testar conexão com o servidor
    try:
        response = urllib.request.urlopen(f'{server_url}/api/commands')
        if response.getcode() == 200:
            print("✅ Servidor conectado com sucesso!")
        else:
            print("⚠️ Servidor respondeu com código inesperado")
    except Exception as e:
        print(f"❌ Não foi possível conectar ao servidor: {e}")
        print("💡 Certifique-se de que o servidor está rodando em http://localhost:8001")
        return
    
    # Escolher modo de simulação
    print("\n🎯 Escolha o modo de simulação:")
    print("1. 🏁 Partida ULTRA-AGRESSIVA (15 segundos - ALGUÉM VAI GANHAR!)")
    print("2. 🏁 Partida Rápida (30 segundos intensos)")
    print("3. 🔄 Simulação Contínua (pedaladas aleatórias)")
    print("4. 🔄 Iniciar Nova Partida (comando para o jogo)")
    
    try:
        choice = input("\nDigite 1, 2, 3 ou 4: ").strip()
        if choice == '1':
            mode = 'ultra_aggressive'
        elif choice == '2':
            mode = 'quick_game'
        elif choice == '3':
            mode = 'continuous'
        elif choice == '4':
            mode = 'new_game'
        else:
            print("❌ Opção inválida, usando modo contínuo")
            mode = 'continuous'
    except KeyboardInterrupt:
        print("\n🛑 Cancelado pelo usuário")
        return
    
    # Criar simulador
    simulator = ESP32Simulator(server_url=server_url)
    
    try:
        if mode == 'new_game':
            print("\n🔄 Enviando comando para iniciar nova partida...")
            simulator.start_new_game()
            print("✅ Comando enviado!")
            return
        
        simulator.start(mode=mode)
        
        if mode == 'ultra_aggressive':
            print("\n🏁 Partida ULTRA-AGRESSIVA iniciada!")
            print("📊 Simulando competição ULTRA intensa de 15 segundos")
            print("🎯 Todos os jogadores pedalando AGGRESSIVAMENTE")
            print("⚡ ALGUÉM VAI GANHAR RAPIDAMENTE!")
            print("\n⏹️  Aguarde a conclusão da partida...")
            
            # Aguardar a partida terminar
            time.sleep(20)  # 15s + 5s de margem
            simulator.stop()
            print("🏁 Partida ULTRA-AGRESSIVA concluída!")
            
        elif mode == 'quick_game':
            print("\n🏁 Partida Rápida iniciada!")
            print("📊 Simulando competição intensa de 30 segundos")
            print("🎯 Todos os jogadores pedalando agressivamente")
            print("\n⏹️  Aguarde a conclusão da partida...")
            
            # Aguardar a partida terminar
            time.sleep(35)  # 30s + 5s de margem
            simulator.stop()
            print("🏁 Partida simulada concluída!")
            
        else:
            print("\n🔄 Simulação contínua rodando...")
            print("📊 Enviando comandos de pedalada automaticamente")
            print("🎯 Jogadores simulados:")
            print("  - Jogador 1: Tecla Q")
            print("  - Jogador 2: Tecla W") 
            print("  - Jogador 3: Tecla E")
            print("  - Jogador 4: Tecla R")
            print("\n⏹️  Pressione Ctrl+C para parar")
            
            while True:
                time.sleep(1)
                
    except KeyboardInterrupt:
        print("\n🛑 Parando simulador...")
    finally:
        simulator.stop()

if __name__ == "__main__":
    main()
