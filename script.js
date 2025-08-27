class BikeJJGame {
    constructor() {
        this.gameState = 'waiting'; // waiting, playing, finished
        this.gameTime = 0;
        this.gameTimer = null;
        
        // Configurações padrão
        this.defaultConfig = {
            energyDecayRate: 15.0,  // 15% por segundo (mais agressivo)
            energyGainRate: 5.0,    // 5% por pedalada (mais rápido)
            ledStrobeRate: 200
        };
        
        // Carregar configurações salvas ou usar padrões
        this.loadConfig();
        
        this.maxEnergy = 100; // Fixo em 100%
        
        // Sistema de relatórios
        this.gameReports = [];
        this.currentGameReport = null;
        
        this.players = [
            { id: 1, key: 'KeyQ', energy: 0, score: 0, isPedaling: false, lastPedalTime: 0 },
            { id: 2, key: 'KeyW', energy: 0, score: 0, isPedaling: false, lastPedalTime: 0 },
            { id: 3, key: 'KeyE', energy: 0, score: 0, isPedaling: false, lastPedalTime: 0 },
            { id: 4, key: 'KeyR', energy: 0, score: 0, isPedaling: false, lastPedalTime: 0 }
        ];
        
        // Sistema de LEDs virtuais
        this.virtualLeds = {
            elements: {},
            strobeTimers: {},
            isStrobing: false,
            currentWinner: null
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupGameLoop();
        this.loadGameReports(); // Carregar relatórios salvos
        this.setupVirtualLeds(); // Configurar LEDs virtuais
        this.updateDisplay();
        
            // Sistema de polling para comunicação em tempo real
    this.setupPolling();
    
    // Controle de pedaladas do ESP32
    this.esp32Connected = false;
    this.lastPedalCount = 0;
    this.lastPedalTime = 0;
    this.decayTimer = null;
    this.debugCounter = 0; // Contador para logs de debug
    }
    
    setupEventListeners() {
        // Controles do jogo
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());
        
        // Menu de configurações
        document.getElementById('configBtn').addEventListener('click', () => this.showConfigMenu());
        document.getElementById('closeConfig').addEventListener('click', () => this.hideConfigMenu());
        document.getElementById('applyConfig').addEventListener('click', () => this.applyConfig());
        document.getElementById('resetConfig').addEventListener('click', () => this.resetConfig());
        
        // Eventos dos sliders de configuração
        this.setupConfigSliders();
        
        // Controles por teclado
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Prevenir comportamento padrão para as teclas do jogo
        document.addEventListener('keydown', (e) => {
            if (['KeyQ', 'KeyW', 'KeyE', 'KeyR'].includes(e.code)) {
                e.preventDefault();
            }
        });
    }
    
    // Configurar polling para verificar estado do jogo
    setupPolling() {
        // Polling rápido para simular tempo real
        setInterval(() => {
            this.checkGameState();
        }, 50); // Verificar a cada 50ms (20 FPS)
    }
    
    async checkGameState() {
        try {
            const response = await fetch('/api/state');
            const gameState = await response.json();
            
            // Atualizar energia do jogador 1
            if (gameState.player1_energy !== this.players[0].energy) {
                const oldEnergy = this.players[0].energy;
                this.players[0].energy = gameState.player1_energy;
                
                // Log da mudança de energia
                if (gameState.player1_energy > oldEnergy) {
                    console.log(`🚴 PEDALADA #${gameState.pedal_count} - Jogador 1: ${gameState.player1_energy}%`);
                } else if (gameState.player1_energy < oldEnergy) {
                    // Energia diminuiu - não resetar timer (decaimento natural)
                    console.log(`📉 Energia diminuiu: ${oldEnergy}% → ${gameState.player1_energy}%`);
                }
                
                // USAR O CAMPO is_pedaling DO SERVIDOR (mesma lógica das teclas QWER)
                if (gameState.is_pedaling !== undefined) {
                    this.players[0].isPedaling = gameState.is_pedaling;
                    if (gameState.is_pedaling) {
                        console.log('✅ Jogador 1 marcado como pedalando (ESP32)');
                    } else {
                        console.log('🛑 Jogador 1 parou de pedalar (ESP32 - Inatividade)');
                    }
                }
                
                // Atualizar contador de pedaladas
                this.updatePedalCount(gameState.pedal_count);
                
                // Atualizar status do ESP32
                this.updateESP32Status(true);
                
                // Atualizar display
                this.updateDisplay();
                
                // Verificar vitória
                if (gameState.player1_energy >= 100 && this.gameState !== 'finished') {
                    console.log('🏆 VITÓRIA! Jogador 1 chegou a 100% de energia!');
                    this.declareWinner(1);
                    return; // Parar processamento
                }
            }
            
                            // Debug: mostrar estado atual a cada 5 segundos
                if (this.debugCounter % 100 === 0) { // A cada 5 segundos (100 * 50ms)
                    console.log(`🔍 Estado: Jogo=${this.gameState}, Energia=${this.players[0].energy}, Pedalando=${this.players[0].isPedaling}, ÚltimaPedalada=${Math.round((Date.now() - this.players[0].lastPedalTime)/1000)}s atrás`);
                }
                this.debugCounter++;
                
                // LÓGICA SIMPLES: O servidor já envia is_pedaling = true/false
                // Não precisa de lógica complexa aqui
            
        } catch (error) {
            console.log('❌ Erro no polling: ' + error);
        }
    }
    
    // Processar mensagens WebSocket
    handleWebSocketMessage(message) {
        switch (message.type) {
            case 'pedal_energy':
                this.handlePedalEnergy(message);
                break;
            case 'stop_pedaling':
                this.handleStopPedaling(message);
                break;
            case 'winner':
                this.handleWinner(message);
                break;
            case 'game_state':
                this.handleGameState(message);
                break;
            default:
                console.log('📨 Mensagem WebSocket não reconhecida:', message);
        }
    }
    
    // Processar energia de pedalada
    handlePedalEnergy(message) {
        if (message.player_id === 1) {
            const player = this.players[0];
            const oldEnergy = player.energy;
            
            // Atualizar energia
            player.energy = message.energy;
            player.isPedaling = true;
            player.lastPedalTime = Date.now();
            
            // Log da pedalada no console
            console.log(`🚴 PEDALADA #${message.pedal_count} - Jogador ${message.player_id}: ${message.energy}%`);
            
            // Atualizar barra
            this.updateEnergyBar(1, message.energy);
            
            // Verificar vitória
            if (message.energy >= 100 && this.gameState !== 'finished') {
                this.declareWinner(1);
            }
        }
    }
    
    // Processar parada de pedalada
    handleStopPedaling(message) {
        if (message.player_id === 1) {
            const player = this.players[0];
            player.isPedaling = false;
        }
    }
    
    // Processar vitória
    handleWinner(message) {
        if (message.player_id === 1) {
            this.declareWinner(1);
        }
    }
    
    // Processar estado do jogo
    handleGameState(message) {
        if (message.data) {
            this.gameState = message.data.game_active ? 'playing' : 'waiting';
            this.players[0].energy = message.data.player1_energy;
            this.updateDisplay();
        }
    }
    
    // Enviar comando via WebSocket
    sendWebSocketCommand(command) {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify(command));
        }
    }
    
    // Configurar LEDs virtuais
    setupVirtualLeds() {
        // Obter elementos dos LEDs
        for (let i = 1; i <= 4; i++) {
            this.virtualLeds.elements[i] = document.getElementById(`led${i}`);
        }
        
        // Aplicar taxa de strobe inicial
        this.updateStrobeRate();
        
        // Event listeners para teste manual (opcional)
        Object.values(this.virtualLeds.elements).forEach(led => {
            led.addEventListener('click', () => {
                const playerId = parseInt(led.dataset.player);
                this.testLedStrobe(playerId);
            });
        });
    }
    
    // Sistema de decaimento de energia (usando a mesma lógica das teclas QWER)
    // O decaimento é aplicado automaticamente no updateGame() quando isPedaling = false
    
    // Verificar comandos externos da ESP32
    async checkExternalCommands() {
        try {
            const response = await fetch('/api/commands');
            if (response.ok) {
                const data = await response.json();
                const commands = data.commands || [];
                const gameState = data.game_state || {};
                
                // Atualizar estado do jogo do ESP32
                if (gameState.player1_energy !== undefined) {
                    this.players[0].energy = gameState.player1_energy;
                    this.updateEnergyBar(1, gameState.player1_energy);
                }
                
                // Verificar se ESP32 está conectado
                if (gameState.game_active !== undefined) {
                    this.esp32Connected = gameState.game_active;
                }
                
                // Processar comandos
                if (commands && commands.length > 0) {
                    commands.forEach(command => {
                        this.processExternalCommand(command);
                    });
                }
            }
        } catch (error) {
            // Silenciar erros de polling para não poluir o console
        }
    }
    
    // Processar comando externo da ESP32
    processExternalCommand(command) {
        // Processar comando externo
        
        switch (command.type) {
            case 'pedal_energy':
                // Energia do ESP32 para jogador 1
                if (command.player_id === 1) {
                    const player = this.players[0];
                    const oldEnergy = player.energy;
                    
                    // Atualizar energia
                    player.energy = command.energy;
                    
                    // Marcar como pedalando quando receber energia do ESP32
                    player.isPedaling = true;
                    player.lastPedalTime = Date.now();
                    
 E                    // Log da pedalada no console do browser
                    console.log(`🚴 PEDALADA #${command.pedal_count} - Jogador ${command.player_id}: ${command.energy}%`);
                    
                    // Atualizar barra
                    this.updateEnergyBar(1, command.energy);
                    
                    // Verificar vitória
                    if (command.energy >= 100 && this.gameState !== 'finished') {
                        this.declareWinner(1);
                    }
                }
                break;
                
            case 'winner':
                // Vitória declarada pelo ESP32
                if (this.gameState !== 'finished') {
                    this.declareWinner(command.player_id);
                }
                break;
                
            case 'reset_game':
                // Reset do jogo
                this.resetGame();
                break;
                
            case 'new_game':
                // Nova partida
                this.newGame();
                break;
                
            case 'stop_pedaling':
                // ESP32 parou de pedalar
                if (command.player_id === 1) {
                    const player = this.players[0];
                    player.isPedaling = false;
                }
                break;
                
            case 'key_press':
                // Comando de tecla (para outros jogadores)
                if (command.player_id > 1) {
                    this.handleKeyPress(command.key, command.player_id);
                }
                break;
                
            default:
                // Comando antigo (compatibilidade)
                const { player_id, action, key } = command;
                if (player_id && action && key) {
                    // Simular evento de tecla
                    const keyEvent = new KeyboardEvent(action === 'keydown' ? 'keydown' : 'keyup', {
                        code: key,
                        key: key.toLowerCase(),
                        bubbles: true
                    });
                    
                    // Disparar evento no documento
                    document.dispatchEvent(keyEvent);
                }
                break;
        }
    }
    
    // Notificar servidor sobre início do jogo
    async notifyServerGameStart() {
        try {
            const response = await fetch('/api/start-game');
            if (response.ok) {
                const data = await response.json();
            }
        } catch (error) {
            // Silenciar erro
        }
    }
    
    // Notificar servidor sobre reset do jogo
    async notifyServerGameReset() {
        try {
            const response = await fetch('/api/reset-game');
            if (response.ok) {
                const data = await response.json();
            }
        } catch (error) {
            // Silenciar erro
        }
    }
    
    // Atualizar taxa de strobe nos LEDs
    updateStrobeRate() {
        const rate = this.ledStrobeRate || 200;
        document.documentElement.style.setProperty('--strobe-rate', `${rate}ms`);
    }
    
    // Atualizar contador de pedaladas
    updatePedalCount(count) {
        const pedalCountElement = document.getElementById('pedalCount');
        if (pedalCountElement) {
            pedalCountElement.textContent = count;
        }
    }
    
    // Atualizar status do ESP32
    updateESP32Status(connected) {
        const statusElement = document.getElementById('esp32Status');
        if (statusElement) {
            if (connected) {
                statusElement.textContent = 'Conectado ✅';
                statusElement.style.color = '#4CAF50';
            } else {
                statusElement.textContent = 'Desconectado ❌';
                statusElement.style.color = '#f44336';
            }
        }
    }
    
    // Atualizar barra de energia
    updateEnergyBar(playerId, energy) {
        const player = this.players.find(p => p.id === playerId);
        if (player) {
            player.energy = energy;
            this.updateDisplay();
        }
    }
    
    // Ativar LED do vencedor com strobe
    activateWinnerLed(playerId) {
        // Resetar todos os LEDs
        this.resetAllLeds();
        
        const led = this.virtualLeds.elements[playerId];
        if (led) {
            // Ativar LED do vencedor
            led.classList.add('active', 'strobe');
            this.virtualLeds.isStrobing = true;
            this.virtualLeds.currentWinner = playerId;
        }
    }
    
    // Resetar todos os LEDs
    resetAllLeds() {
        Object.values(this.virtualLeds.elements).forEach(led => {
            led.classList.remove('active', 'strobe');
        });
        
        // Limpar timers de strobe
        Object.values(this.virtualLeds.strobeTimers).forEach(timer => {
            clearInterval(timer);
        });
        
        this.virtualLeds.strobeTimers = {};
        this.virtualLeds.isStrobing = false;
        this.virtualLeds.currentWinner = null;
    }
    
    // Teste manual de strobe (desenvolvimento)
    testLedStrobe(playerId) {
        if (this.gameState === 'waiting') {
            this.activateWinnerLed(playerId);
            
            // Auto-reset após 3 segundos
            setTimeout(() => {
                this.resetAllLeds();
            }, 3000);
        }
    }
    
    // Enviar dados via UDP
    async sendUDPData(type, playerId = 0) {
        try {
            const data = {
                type: type,
                player_id: playerId,
                timestamp: Date.now()
            };
            
            const response = await fetch('/api/udp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                const responseData = await response.text();
            }
        } catch (error) {
            // Silenciar erro
        }
    }
    
    setupGameLoop() {
        // Loop principal do jogo - 60 FPS
        setInterval(() => {
            if (this.gameState === 'playing') {
                this.updateGame();
            }
        }, 1000 / 60);
    }
    
    startGame() {
        if (this.gameState !== 'waiting') return;
        
        this.gameState = 'playing';
        
        // ATIVAR JOGO NO SERVIDOR
        fetch('/api/start-game')
            .then(response => response.text())
            .then(data => {
                console.log('✅ Jogo ativado no servidor!');
            })
            .catch(error => {
                console.log('❌ Erro ao ativar jogo: ' + error);
            });
        
        // Iniciar relatório da partida atual
        this.startGameReport();
        
        // Reset das barras de energia
        this.players.forEach(player => {
            player.energy = 0;
            player.score = 0;
            player.isPedaling = false;
            
            // Inicializar segmentos como apagados
            this.initializeEnergySegments(player.id);
        });
        
        // Inicializar estado de pedalada
        this.players[0].isPedaling = false;
        this.players[0].lastPedalTime = Date.now();
        console.log('✅ Sistema de pedalada ESP32 inicializado');
        
        document.getElementById('startBtn').disabled = true;
        document.getElementById('startBtn').textContent = 'Jogo em Andamento';
        
        this.updateDisplay();
        this.showMessage('Jogo iniciado! Pedale na bicicleta para ganhar energia! Primeiro a 100% vence!');
    }
    
    handleKeyDown(e) {
        if (this.gameState !== 'playing') {
            return;
        }
        
        const player = this.players.find(p => p.key === e.code);
        if (player) {
            this.pedal(player.id);
        }
    }
    
    handleKeyUp(e) {
        if (this.gameState !== 'playing') return;
        
        const player = this.players.find(p => p.key === e.code);
        if (player) {
            this.stopPedaling(player.id);
        }
    }
    
    pedal(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) {
            return;
        }
        
        const now = Date.now();
        
        // Evitar spam de inputs (mínimo 50ms entre inputs)
        if (now - player.lastPedalTime < 50) {
            return;
        }
        
        player.lastPedalTime = now;
        player.isPedaling = true;
        
        // Aumentar energia
        const oldEnergy = player.energy;
        player.energy = Math.min(this.maxEnergy, player.energy + this.energyGainRate);
        
        // Verificar se atingiu energia máxima
        if (player.energy >= this.maxEnergy) {
            this.endGameWithWinner(player);
            return;
        }
        
        // Adicionar pontuação baseada na energia atual
        const energyBonus = Math.floor(player.energy / 20);
        player.score += 0.5 + energyBonus;
        
        // Atualizar display
        this.updateDisplay();
    }
    
    recordPedalEvent(playerId, energy) {
        if (!this.currentGameReport) return;
        
        const reportPlayer = this.currentGameReport.players.find(p => p.id === playerId);
        if (reportPlayer) {
            reportPlayer.totalPedals++;
            reportPlayer.energyHistory.push(energy);
            reportPlayer.pedalTimestamps.push(new Date().toISOString());
            
            // Adicionar evento de pedalada
            this.addGameEvent('pedal', `Jogador ${playerId} pedalou`, playerId, {
                energy: energy,
                totalPedals: reportPlayer.totalPedals
            });
        }
    }
    
    stopPedaling(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (player) {
            player.isPedaling = false;
        }
    }
    
    updateGame() {
        const now = Date.now();
        
        this.players.forEach(player => {
            
            
            // Decaimento natural da energia (por segundo, não por frame)
            if (!player.isPedaling) {
                const oldEnergy = player.energy;
                // Aplicar decaimento por segundo, não por frame
                const decayPerFrame = this.energyDecayRate / 60; // Converter para por frame
                player.energy = Math.max(0, player.energy - decayPerFrame);
                
                
            }
            
            // Atualizar pontuação baseada na energia constante
            if (player.energy > 60 && player.isPedaling) {
                player.score += 0.05; // Reduzido o bônus de consistência
            }
            
                    // Verificar se algum jogador atingiu energia máxima (vitória instantânea)
        if (player.energy >= this.maxEnergy) {
            this.endGameWithWinner(player);
            return;
        }
            

        });
        
        // Atualizar relatório em tempo real
        this.updateGameReport();
        this.updateDisplay();
    }
    
    updateDisplay() {
        this.players.forEach(player => {
            // Atualizar barra de energia (cresce de baixo para cima)
            const energyFill = document.getElementById(`energy${player.id}`);
            const energyPercentage = (player.energy / this.maxEnergy) * 100;
            energyFill.style.height = `${energyPercentage}%`;
            energyFill.style.bottom = '0'; // Garantir que cresça de baixo
            
            // Atualizar pontuação
            const scoreElement = document.querySelector(`#player${player.id} .player-score`);
            scoreElement.textContent = Math.floor(player.score);
            
            // Atualizar status
            const statusElement = document.getElementById(`status${player.id}`);
            if (player.isPedaling) {
                statusElement.textContent = 'Pedalando! 🚴';
                statusElement.style.color = '#4CAF50';
            } else if (player.energy > 0) {
                statusElement.textContent = 'Desacelerando...';
                statusElement.style.color = '#FF9800';
            } else {
                statusElement.textContent = 'Parado';
                statusElement.style.color = '#666';
            }
            
            // Adicionar classe ativa para jogadores com energia
            const playerBar = document.getElementById(`player${player.id}`);
            if (player.energy > 0) {
                playerBar.classList.add('active');
            } else {
                playerBar.classList.remove('active');
            }
            
            // Atualizar estados dos segmentos de cores
            this.updateEnergySegments(player.id, player.energy);
        });
    }
    
    updateEnergySegments(playerId, energy) {
        const segments = document.querySelectorAll(`#player${playerId} .segment`);
        const maxEnergy = this.maxEnergy;
        
        // Atualizar segmentos de energia
        
        segments.forEach((segment, index) => {
            // Calcular energia necessária para cada segmento
            const segmentEnergy = (maxEnergy / 7) * (index + 1);
            const previousSegmentEnergy = index > 0 ? (maxEnergy / 7) * index : 0;
            
            // Determinar estado baseado na energia atual
            if (energy <= 0) {
                // Energia zero - todos os segmentos apagados
                segment.className = `segment ${this.getSegmentColor(index)} off`;
                segment.style.height = '0%';
                // Segmento apagado (energia zero)
                segment.className = `segment ${this.getSegmentColor(index)} off`;
                segment.style.height = '0%';
            } else if (energy >= segmentEnergy) {
                // Segmento completamente ativo
                segment.className = `segment ${this.getSegmentColor(index)} active`;
                segment.style.height = '14.28%';
            } else if (energy > previousSegmentEnergy) {
                // Segmento em transição (crescendo)
                const progress = (energy - previousSegmentEnergy) / (segmentEnergy - previousSegmentEnergy);
                const height = 14.28 * progress; // Altura em %
                segment.className = `segment ${this.getSegmentColor(index)} growing`;
                segment.style.height = `${height}%`;
            } else {
                // Segmento apagado (energia insuficiente)
                segment.className = `segment ${this.getSegmentColor(index)} off`;
                segment.style.height = '0%';
            }
        });
    }
    
    getSegmentColor(index) {
        // Cores de baixo para cima (vermelho → azul)
        const colors = ['red', 'orange', 'yellow', 'light-green', 'green', 'light-blue', 'blue'];
        return colors[index];
    }
    
    initializeEnergySegments(playerId) {
        const segments = document.querySelectorAll(`#player${playerId} .segment`);
        
        segments.forEach((segment, index) => {
            // Aplicar cor baseada na posição e estado inicial apagado
            segment.className = `segment ${this.getSegmentColor(index)} off`;
        });
    }
    
    endGame() {
        this.gameState = 'finished';
        
        // Determinar vencedor
        const winner = this.players.reduce((prev, current) => 
            (prev.score > current.score) ? prev : current
        );
        
        // Mostrar tela de vencedor
        this.showWinner(winner);
        
        document.getElementById('startBtn').disabled = false;
        document.getElementById('startBtn').textContent = 'Iniciar Jogo';
    }
    
    declareWinner(playerId) {
        // Declarar vitória de um jogador
        const player = this.players.find(p => p.id === playerId);
        if (player) {
            console.log(`🏆 Vitória declarada para jogador ${playerId}!`);
            
            // Parar timer de decaimento
            this.stopEnergyDecay();
            console.log('⏰ Timer de decaimento parado - Jogo finalizado');
            
            this.endGameWithWinner(player);
        }
    }
    
    endGameWithWinner(winner) {
        this.gameState = 'finished';
        
        // Mostrar tela de vencedor por energia máxima
        this.showWinner(winner, true);
        
        document.getElementById('startBtn').disabled = false;
        document.getElementById('startBtn').textContent = 'Iniciar Jogo';
    }
    
    showWinner(winner, isEnergyMax = false) {
        // Aplicar efeitos visuais na barra do ganhador
        this.applyWinnerEffects(winner.id);
        
        // Marcar todos os outros jogadores como perdedores
        this.markLosers(winner.id);
        
        // Ativar LED do vencedor com strobe
        this.activateWinnerLed(winner.id);
        
        // Enviar dados do vencedor via UDP
        this.sendUDPData('winner', winner.id);
        
        // Mostrar botão de nova partida
        document.getElementById('newGameButton').style.display = 'block';
        
        // Efeitos visuais especiais - mais intensos
        this.createCasinoParticles(winner.id);
        
        // Finalizar relatório da partida
        this.finalizeGameReport(winner, isEnergyMax);
        
        // Mostrar mensagem de vitória
        if (isEnergyMax) {
            this.showMessage(`🏆 Jogador ${winner.id} VENCEU! Energia máxima atingida! (${Math.floor(winner.score)} pontos)`);
        } else {
            this.showMessage(`🏆 Jogador ${winner.id} VENCEU! ${Math.floor(winner.score)} pontos!`);
        }
        
        // Iniciar contador de reinício automático
        this.startAutoRestartCountdown();
    }
    
    applyWinnerEffects(winnerId) {
        // Aplicar classe winner na barra do jogador
        const playerBar = document.getElementById(`player${winnerId}`);
        const energyBar = playerBar.querySelector('.energy-bar');
        const energyFill = playerBar.querySelector('.energy-fill');
        
        playerBar.classList.add('winner');
        energyBar.classList.add('winner');
        energyFill.classList.add('winner');
        
        // Adicionar efeito de destaque no nome
        const playerName = playerBar.querySelector('.player-name');
        playerName.innerHTML = `👑 ${playerName.textContent} 👑`;
        playerName.style.color = '#FFD700';
        playerName.style.fontWeight = 'bold';
        
        // Efeito de rotação na pontuação
        const playerScore = playerBar.querySelector('.player-score');
        playerScore.style.animation = 'winnerScoreSpin 1s ease-out';
        playerScore.style.transform = 'scale(1.2)';
    }
    
    createCasinoParticles(winnerId) {
        // Criar múltiplas explosões de partículas tipo cassino
        const playerBar = document.getElementById(`player${winnerId}`);
        const rect = playerBar.getBoundingClientRect();
        
        // Explosão principal
        for (let i = 0; i < 60; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                const colors = ['#FFD700', '#FF0000', '#00FF00', '#0000FF', '#FF00FF', '#00FFFF', '#FFFFFF'];
                const color = colors[Math.floor(Math.random() * colors.length)];
                const size = Math.random() * 12 + 3;
                
                particle.style.cssText = `
                    position: fixed;
                    left: ${rect.left + rect.width/2 + (Math.random() - 0.5) * 200}px;
                    top: ${rect.top + rect.height/2 + (Math.random() - 0.5) * 200}px;
                    width: ${size}px;
                    height: ${size}px;
                    background: ${color};
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 9999;
                    box-shadow: 0 0 20px ${color};
                `;
                
                document.body.appendChild(particle);
                
                // Animação estilo cassino - explosiva
                const animation = particle.animate([
                    { 
                        transform: 'scale(0) rotate(0deg)', 
                        opacity: 1,
                        filter: 'brightness(2)'
                    },
                    { 
                        transform: `scale(2) rotate(${Math.random() * 1080}deg)`, 
                        opacity: 0.9,
                        filter: 'brightness(3)'
                    },
                    { 
                        transform: `scale(0.5) rotate(${Math.random() * 1440}deg)`, 
                        opacity: 0,
                        filter: 'brightness(1)'
                    }
                ], {
                    duration: 1500 + Math.random() * 1000,
                    easing: 'ease-out'
                });
                
                animation.onfinish = () => particle.remove();
            }, i * 20);
        }
        
        // Chuva de estrelas
        this.createStarRain(winnerId);
    }
    

    
    createStarRain(winnerId) {
        const playerBar = document.getElementById(`player${winnerId}`);
        const rect = playerBar.getBoundingClientRect();
        
        for (let i = 0; i < 40; i++) {
            setTimeout(() => {
                const star = document.createElement('div');
                star.innerHTML = '⭐';
                star.style.cssText = `
                    position: fixed;
                    left: ${rect.left + Math.random() * rect.width}px;
                    top: -20px;
                    font-size: ${Math.random() * 20 + 10}px;
                    pointer-events: none;
                    z-index: 9999;
                    filter: drop-shadow(0 0 10px gold);
                `;
                
                document.body.appendChild(star);
                
                const animation = star.animate([
                    { 
                        transform: 'translateY(0px) rotate(0deg) scale(1)',
                        opacity: 1
                    },
                    { 
                        transform: `translateY(${window.innerHeight + 100}px) rotate(${Math.random() * 720}deg) scale(1.5)`,
                        opacity: 0
                    }
                ], {
                    duration: 2000 + Math.random() * 1000,
                    easing: 'ease-in'
                });
                
                animation.onfinish = () => star.remove();
            }, i * 100);
        }
    }
    
    markLosers(winnerId) {
        // Marcar todos os jogadores exceto o vencedor como perdedores
        this.players.forEach(player => {
            if (player.id !== winnerId) {
                const playerBar = document.getElementById(`player${player.id}`);
                const energyBar = playerBar.querySelector('.energy-bar');
                const energyFill = playerBar.querySelector('.energy-fill');
                const playerName = playerBar.querySelector('.player-name');
                const playerScore = playerBar.querySelector('.player-score');
                const playerStatus = playerBar.querySelector('.player-status');
                
                // Adicionar classes de perdedor
                playerBar.classList.add('loser');
                energyBar.classList.add('loser');
                energyFill.classList.add('loser');
                playerName.classList.add('loser');
                playerScore.classList.add('loser');
                playerStatus.classList.add('loser');
            }
        });
    }
    
    startAutoRestartCountdown() {
        let countdown = 10;
        const countdownElement = document.getElementById('restartCountdown');
        
        const timer = setInterval(() => {
            countdown--;
            countdownElement.textContent = countdown;
            
            if (countdown <= 0) {
                clearInterval(timer);
                this.autoRestart();
            }
        }, 1000);
        
        // Salvar referência do timer para poder cancelar se necessário
        this.autoRestartTimer = timer;
    }
    
    autoRestart() {
        // Reiniciar automaticamente após 10 segundos e iniciar o jogo
        this.newGame();
        this.startGame();
    }
    
    // Métodos para sistema de relatórios
    startGameReport() {
        this.currentGameReport = {
            gameId: Date.now(),
            startTime: new Date().toISOString(),
            endTime: null,
            duration: 0,
            winner: null,
            players: [],
            gameConfig: {
                energyGainRate: this.energyGainRate,
                energyDecayRate: this.energyDecayRate,
                maxEnergy: this.maxEnergy
            },
            events: [],
            statistics: {
                totalPedals: 0,
                maxEnergyReached: 0,
                averageEnergy: 0
            }
        };
        
        // Inicializar dados dos jogadores
        this.players.forEach(player => {
            this.currentGameReport.players.push({
                id: player.id,
                key: player.key,
                finalScore: 0,
                finalEnergy: 0,
                totalPedals: 0,
                maxEnergyReached: 0,
                averageEnergy: 0,
                energyHistory: [],
                pedalTimestamps: []
            });
        });
        
        // Adicionar evento de início
        this.addGameEvent('game_started', 'Jogo iniciado');
    }
    
    addGameEvent(type, description, playerId = null, data = {}) {
        if (this.currentGameReport) {
            this.currentGameReport.events.push({
                timestamp: new Date().toISOString(),
                type: type,
                description: description,
                playerId: playerId,
                data: data
            });
        }
    }
    
    updateGameReport() {
        if (!this.currentGameReport) return;
        
        // Atualizar estatísticas dos jogadores
        this.players.forEach((player, index) => {
            const reportPlayer = this.currentGameReport.players[index];
            reportPlayer.finalScore = Math.floor(player.score);
            reportPlayer.finalEnergy = player.energy;
            reportPlayer.maxEnergyReached = Math.max(reportPlayer.maxEnergyReached, player.energy);
            
            // Calcular energia média
            if (reportPlayer.energyHistory.length > 0) {
                const sum = reportPlayer.energyHistory.reduce((a, b) => a + b, 0);
                reportPlayer.averageEnergy = sum / reportPlayer.energyHistory.length;
            }
        });
        
        // Atualizar estatísticas gerais
        this.currentGameReport.statistics.totalPedals = this.currentGameReport.players.reduce((sum, p) => sum + p.totalPedals, 0);
        this.currentGameReport.statistics.maxEnergyReached = Math.max(...this.currentGameReport.players.map(p => p.maxEnergyReached));
        this.currentGameReport.statistics.averageEnergy = this.currentGameReport.players.reduce((sum, p) => sum + p.averageEnergy, 0) / this.currentGameReport.players.length;
    }
    
    finalizeGameReport(winner, isEnergyMax = false) {
        if (!this.currentGameReport) return;
        
        this.currentGameReport.endTime = new Date().toISOString();
        this.currentGameReport.duration = new Date(this.currentGameReport.endTime) - new Date(this.currentGameReport.startTime);
        this.currentGameReport.winner = {
            id: winner.id,
            score: Math.floor(winner.score),
            energy: winner.energy,
            victoryType: isEnergyMax ? 'energy_max' : 'time_limit'
        };
        
        // Atualizar estatísticas finais
        this.updateGameReport();
        
        // Adicionar evento de vitória
        this.addGameEvent('game_ended', `Jogador ${winner.id} venceu!`, winner.id, {
            score: Math.floor(winner.score),
            energy: winner.energy,
            victoryType: isEnergyMax ? 'energy_max' : 'time_limit'
        });
        
        // Salvar relatório
        this.gameReports.push(this.currentGameReport);
        this.saveGameReports();
        
        this.currentGameReport = null;
    }
    
    saveGameReports() {
        try {
            localStorage.setItem('bikejj_game_reports', JSON.stringify(this.gameReports));
        } catch (error) {
            // Silenciar erro
        }
    }
    
    loadGameReports() {
        try {
            const savedReports = localStorage.getItem('bikejj_game_reports');
            if (savedReports) {
                this.gameReports = JSON.parse(savedReports);
            }
        } catch (error) {
            this.gameReports = [];
        }
    }
    
    showGameSummary() {
        const report = this.gameReports[this.gameReports.length - 1];
        if (!report) return;
        
        this.showMessage(`🏆 Partida finalizada! Jogador ${report.winner.id} venceu!`);
    }
    
    exportGameReports() {
        const dataStr = JSON.stringify(this.gameReports, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `bikejj_game_reports_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.showMessage('📊 Relatórios exportados com sucesso!');
    }
    
    showGameReports() {
        if (this.gameReports.length === 0) {
            this.showMessage('📊 Nenhuma partida registrada ainda');
            return;
        }
        
        this.showMessage(`📊 ${this.gameReports.length} partidas registradas!`);
    }
    
    resetGame() {
        this.gameState = 'waiting';
        
        // RESETAR JOGO NO SERVIDOR
        fetch('/api/reset-game')
            .then(response => response.text())
            .then(data => {
                console.log('🔄 Jogo resetado no servidor!');
            })
            .catch(error => {
                console.log('❌ Erro ao resetar jogo: ' + error);
            });
        
        // Parar decaimento de energia
        this.stopEnergyDecay();
        
        // Cancelar timer automático se estiver rodando
        if (this.autoRestartTimer) {
            clearInterval(this.autoRestartTimer);
            this.autoRestartTimer = null;
        }
        
        this.players.forEach(player => {
            player.energy = 0;
            player.score = 0;
            player.isPedaling = false;
        });
        
        document.getElementById('startBtn').disabled = false;
        document.getElementById('startBtn').textContent = 'Iniciar Jogo';
        
        // Remover efeitos de vencedor
        this.removeWinnerEffects();
        
        this.updateDisplay();
        this.showMessage('Jogo reiniciado!');
    }
    
    removeWinnerEffects() {
        // Remover todas as classes e efeitos de vencedor e perdedor
        this.players.forEach(player => {
            const playerBar = document.getElementById(`player${player.id}`);
            const energyBar = playerBar.querySelector('.energy-bar');
            const energyFill = playerBar.querySelector('.energy-fill');
            const playerName = playerBar.querySelector('.player-name');
            const playerScore = playerBar.querySelector('.player-score');
            const playerStatus = playerBar.querySelector('.player-status');
            
            // Remover classes de vencedor
            playerBar.classList.remove('winner');
            energyBar.classList.remove('winner');
            energyFill.classList.remove('winner');
            
            // Remover classes de perdedor
            playerBar.classList.remove('loser');
            energyBar.classList.remove('loser');
            energyFill.classList.remove('loser');
            playerName.classList.remove('loser');
            playerScore.classList.remove('loser');
            playerStatus.classList.remove('loser');
            
            // Restaurar nome e pontuação
            playerName.innerHTML = playerName.textContent.replace(/👑 /g, '').replace(/ 👑/g, '');
            playerName.style.color = '';
            playerName.style.fontWeight = '';
            
            playerScore.style.animation = '';
            playerScore.style.transform = '';
        });
    }
    
    newGame() {
        // Cancelar timer automático se estiver rodando
        if (this.autoRestartTimer) {
            clearInterval(this.autoRestartTimer);
            this.autoRestartTimer = null;
        }
        
        // Resetar LEDs virtuais
        this.resetAllLeds();
        
        // Enviar sinal de reset via UDP
        this.sendUDPData('reset', 0);
        
        document.getElementById('newGameButton').style.display = 'none';
        this.removeWinnerEffects();
        this.resetGame();
        this.startGame();
    }
    
    showMessage(message) {
        // Criar notificação temporária
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            z-index: 1001;
            font-weight: bold;
            transform: translateX(400px);
            transition: transform 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animar entrada
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remover após 3 segundos
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // Métodos do menu de configurações
    showConfigMenu() {
        document.getElementById('configMenu').classList.add('show');
        this.updateConfigDisplay();
        
        // Mostrar status das configurações
        this.updateConfigStatus();
    }
    
    hideConfigMenu() {
        document.getElementById('configMenu').classList.remove('show');
    }
    
    setupConfigSliders() {
        // Configurar sliders para atualizar valores em tempo real
        document.getElementById('energyGainRate').addEventListener('input', (e) => {
            document.getElementById('energyGainValue').textContent = e.target.value + '%';
        });
        
        document.getElementById('energyDecayRate').addEventListener('input', (e) => {
            document.getElementById('energyDecayValue').textContent = e.target.value + '%';
        });
        
        document.getElementById('ledStrobeRate').addEventListener('input', (e) => {
            document.getElementById('ledStrobeValue').textContent = e.target.value + 'ms';
        });
    }
    
    updateConfigDisplay() {
        // Atualizar valores dos sliders com configurações atuais
        document.getElementById('energyGainRate').value = this.energyGainRate;
        document.getElementById('energyGainValue').textContent = this.energyGainRate + '%';
        
        document.getElementById('energyDecayRate').value = this.energyDecayRate;
        document.getElementById('energyDecayValue').textContent = this.energyDecayRate + '%';
        
        document.getElementById('ledStrobeRate').value = this.ledStrobeRate;
        document.getElementById('ledStrobeValue').textContent = this.ledStrobeRate + 'ms';
    }
    
    applyConfig() {
        // Aplicar novas configurações
        this.energyGainRate = parseFloat(document.getElementById('energyGainRate').value);
        this.energyDecayRate = parseFloat(document.getElementById('energyDecayRate').value);
        this.ledStrobeRate = parseInt(document.getElementById('ledStrobeRate').value);
        
        // Atualizar taxa de strobe dos LEDs
        this.updateStrobeRate();
        
        // Salvar configurações automaticamente
        this.saveConfig();
        
        this.hideConfigMenu();
        this.showMessage('Configurações aplicadas e salvas!');
        
        // Atualizar display se o jogo estiver rodando
        if (this.gameState === 'playing') {
            this.updateDisplay();
        }
    }
    
    resetConfig() {
        // Restaurar configurações padrão
        this.energyGainRate = this.defaultConfig.energyGainRate;
        this.energyDecayRate = this.defaultConfig.energyDecayRate;
        this.ledStrobeRate = this.defaultConfig.ledStrobeRate;
        
        // Atualizar taxa de strobe dos LEDs
        this.updateStrobeRate();
        
        // Salvar configurações padrão
        this.saveConfig();
        
        this.updateConfigDisplay();
        this.showMessage('Configurações restauradas para padrão!');
    }
    
    // Métodos para persistência das configurações
    saveConfig() {
        try {
            const config = {
                energyGainRate: this.energyGainRate,
                energyDecayRate: this.energyDecayRate,
                ledStrobeRate: this.ledStrobeRate,
                timestamp: Date.now()
            };
            localStorage.setItem('bikejj_config', JSON.stringify(config));
        } catch (error) {
            // Silenciar erro
        }
    }
    
    loadConfig() {
        try {
            const savedConfig = localStorage.getItem('bikejj_config');
            if (savedConfig) {
                const config = JSON.parse(savedConfig);
                
                // Verificar se as configurações são válidas
                if (config.energyGainRate && config.energyDecayRate) {
                    this.energyGainRate = config.energyGainRate;
                    this.energyDecayRate = config.energyDecayRate;
                    this.ledStrobeRate = config.ledStrobeRate || this.defaultConfig.ledStrobeRate;
                } else {
                    this.useDefaultConfig();
                }
            } else {
                this.useDefaultConfig();
            }
        } catch (error) {
            this.useDefaultConfig();
        }
    }
    
    useDefaultConfig() {
        this.energyGainRate = this.defaultConfig.energyGainRate;
        this.energyDecayRate = this.defaultConfig.energyDecayRate;
        this.ledStrobeRate = this.defaultConfig.ledStrobeRate;
    }
    
    updateConfigStatus() {
        const configStatus = document.getElementById('configStatus');
        const savedConfig = localStorage.getItem('bikejj_config');
        
        if (savedConfig) {
            try {
                const config = JSON.parse(savedConfig);
                const timestamp = new Date(config.timestamp);
                const timeAgo = this.getTimeAgo(timestamp);
                
                configStatus.innerHTML = `
                    <p>✅ Configurações salvas ${timeAgo}</p>
                    <p style="font-size: 0.8rem; margin-top: 5px; opacity: 0.8;">
                        Decaimento: ${config.energyDecayRate}% | Geração: ${config.energyGainRate}%
                    </p>
                `;
            } catch (error) {
                configStatus.innerHTML = '<p>⚠️ Erro ao carregar status</p>';
            }
        } else {
            configStatus.innerHTML = '<p>📝 Nenhuma configuração salva</p>';
        }
    }
    
    getTimeAgo(timestamp) {
        const now = new Date();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (days > 0) return `${days} dia(s) atrás`;
        if (hours > 0) return `${hours} hora(s) atrás`;
        if (minutes > 0) return `${minutes} minuto(s) atrás`;
        return 'agora mesmo';
    }
}

// Inicializar o jogo quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new BikeJJGame();
});
