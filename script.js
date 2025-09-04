class BikeJJGame {
    constructor() {
        this.gameState = 'waiting'; // waiting, playing, finished
        this.gameTime = 0;
        this.gameTimer = null;
        
        // Configurações padrão (mais realistas)
        this.defaultConfig = {
            energyDecayRate: 2.5,   // 2.5% por segundo (mais realista)
            energyGainRate: 1.5,    // 1.5% por pedalada (mais realista)
            ledStrobeRate: 200
        };
        
        // Carregar configurações salvas ou usar padrões (será carregado de forma assíncrona)
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
        
        // Controle de pedaladas do Arduino Mega
        this.arduinoConnected = false;
        this.lastPedalCount = 0;
        this.lastPedalTime = 0;
        this.decayTimer = null;
        this.debugCounter = 0; // Contador para logs de debug
        
        // Sistema de controle offline
        this.offlineMode = false;
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 5;
        this.autoReconnect = true;
        this.offlineTimer = null;
        
            // Verificar conexão inicial após um breve delay
    setTimeout(() => {
        this.checkInitialConnection();
    }, 2000);
}

// Verificar conexão inicial
async checkInitialConnection() {
    try {
        const response = await fetch('/api/state');
        if (response.ok) {
            console.log('✅ Conexão inicial com servidor estabelecida');
            this.offlineMode = false;
            this.updateConnectionStatus(true);
            
            // Verificar se há dados de energia já disponíveis
            const gameState = await response.json();
            console.log(`🔍 Dados iniciais do servidor: ${JSON.stringify(gameState)}`);
            
            // Se o servidor está funcionando, garantir que não estamos em modo offline
            if (this.offlineMode) {
                console.log('🔄 Servidor online detectado - Desativando modo offline');
                this.offlineMode = false;
                this.hideOfflineModal();
                this.stopOfflineTimer();
            }
            
        } else {
            throw new Error('Servidor respondeu com erro');
        }
    } catch (error) {
        console.log('❌ Servidor não disponível na inicialização:', error);
        this.handleServerOffline();
    }
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
        
        // Configurador serial
        const serialConfigBtn = document.getElementById('serialConfigBtn');
        if (serialConfigBtn) {
            serialConfigBtn.addEventListener('click', () => {
                console.log('🔧 Clique no botão Serial detectado!');
                this.openSerialConfig();
            });
            console.log('🔧 Botão Serial configurado com sucesso');
        } else {
            console.error('❌ Botão Serial não encontrado!');
        }
        
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
        
        // Event listeners para modal offline
        this.setupOfflineEventListeners();
    }
    
    // Configurar event listeners para modal offline
    setupOfflineEventListeners() {
        // Botões do modal offline
        const startOfflineBtn = document.getElementById('startOfflineBtn');
        const reconnectBtn = document.getElementById('reconnectBtn');
        const offlineConfigBtn = document.getElementById('offlineConfigBtn');
        const closeOfflineModal = document.getElementById('closeOfflineModal');
        const autoReconnectCheckbox = document.getElementById('autoReconnect');
        
        if (startOfflineBtn) {
            startOfflineBtn.addEventListener('click', () => this.startOfflineGame());
        }
        
        if (reconnectBtn) {
            reconnectBtn.addEventListener('click', () => this.attemptReconnect());
        }
        
        if (offlineConfigBtn) {
            offlineConfigBtn.addEventListener('click', () => this.showConfigMenu());
        }
        
        if (closeOfflineModal) {
            closeOfflineModal.addEventListener('click', () => this.hideOfflineModal());
        }
        
        if (autoReconnectCheckbox) {
            autoReconnectCheckbox.addEventListener('change', (e) => {
                this.autoReconnect = e.target.checked;
                console.log(`🔄 Auto-reconexão: ${this.autoReconnect ? 'Ativada' : 'Desativada'}`);
            });
        }
    }
    
    // Configurar polling para verificar estado do jogo
    setupPolling() {
        // Polling simples e eficiente - 60 FPS
        setInterval(() => {
            this.checkGameState();
        }, 16); // 16ms = 60 FPS
    }
    
    async checkGameState() {
        try {
            const response = await fetch('/api/state');
            const gameState = await response.json();
            
            // Debug: log dos dados recebidos
            if (this.debugCounter % 50 === 0) { // A cada 2.5 segundos
                console.log(`📡 Dados recebidos do servidor:`, gameState);
            }
            
            // Atualizar TODOS os jogadores
            for (let i = 0; i < 4; i++) {
                const player = this.players[i];
                const energyKey = `player${i + 1}_energy`;
                const oldEnergy = player.energy;
                const newEnergy = gameState[energyKey] || 0;
                
                // Debug: log de todas as mudanças
                if (newEnergy !== oldEnergy) {
                    console.log(`🔄 Mudança detectada - Jogador ${i + 1}: ${oldEnergy}% → ${newEnergy}%`);
                }
                
                // Debug: log de todos os valores
                if (this.debugCounter % 100 === 0) {
                    console.log(`🔍 Jogador ${i + 1}: oldEnergy=${oldEnergy}%, newEnergy=${newEnergy}%, key=${energyKey}`);
                }
                
                // Atualizar energia se mudou
                if (newEnergy !== oldEnergy) {
                    player.energy = newEnergy;
                    
                    // Log da mudança de energia
                    if (newEnergy > oldEnergy) {
                        console.log(`🚴 PEDALADA - Jogador ${i + 1}: ${oldEnergy}% → ${newEnergy}%`);
                    } else if (newEnergy < oldEnergy) {
                        console.log(`📉 Decaimento - Jogador ${i + 1}: ${oldEnergy}% → ${newEnergy}%`);
                    }
                }
                
                // Atualizar estado de pedalada
                if (gameState.is_pedaling && gameState.is_pedaling[i] !== undefined) {
                    player.isPedaling = gameState.is_pedaling[i];
                }
                
                // Atualizar contador de pedaladas
                if (gameState.pedal_count && gameState.pedal_count[i] !== undefined) {
                    player.pedalCount = gameState.pedal_count[i];
                }
            }
            
            // Atualizar status do Arduino Mega
            if (gameState.serial_connected) {
                this.updateArduinoStatus(true);
            }
            
            // Atualizar display
            this.updateDisplay();
            
            // Verificar vitória de qualquer jogador
            for (let i = 0; i < this.players.length; i++) {
                if (this.players[i].energy >= 100 && this.gameState !== 'finished') {
                    console.log(`🏆 VITÓRIA! Jogador ${i + 1} chegou a 100% de energia!`);
                    this.declareWinner(i + 1);
                    return;
                }
            }
            
            // JOGO SEMPRE DISPONÍVEL - detectar quando jogo é iniciado automaticamente
            if (gameState.game_active && this.gameState === 'waiting') {
                console.log('🎮 Jogo iniciado automaticamente com pedalada!');
                this.gameState = 'playing';
                this.showMessage('🎮 Jogo iniciado automaticamente! Pedale para ganhar!');
            }
            
            // Debug: mostrar estado atual a cada 5 segundos
            if (this.debugCounter % 100 === 0) { // A cada 5 segundos (100 * 50ms)
                console.log(`🔍 Estado: Jogo=${this.gameState}, Energias=[${this.players.map(p => p.energy).join(', ')}], Pedalando=[${this.players.map(p => p.isPedaling).join(', ')}]`);
                console.log(`🔍 Servidor: Energias=[${gameState.player1_energy}, ${gameState.player2_energy}, ${gameState.player3_energy}, ${gameState.player4_energy}], JogoAtivo=${gameState.game_active}`);
                console.log(`🔍 Jogadores Prontos: ${gameState.players_ready}, Pode Iniciar: ${gameState.game_can_start}`);
                console.log(`🔍 Modo Offline: ${this.offlineMode}`);
            }
            this.debugCounter++;
            
        } catch (error) {
            console.log('❌ Erro no polling: ' + error);
            
            // Detectar se é erro de conexão (servidor offline)
            if (error.name === 'TypeError' || 
                error.message.includes('fetch') || 
                error.message.includes('Failed to fetch') ||
                error.message.includes('NetworkError')) {
                this.handleServerOffline();
            }
        }
    }
    
    // Gerenciar servidor offline
    handleServerOffline() {
        if (!this.offlineMode) {
            console.log('🔌 Servidor offline detectado - Ativando modo offline');
            this.offlineMode = true;
            this.showOfflineModal();
            
            // Iniciar timer para tentar reconectar
            if (this.autoReconnect) {
                this.startOfflineTimer();
            }
        } else {
            console.log('🔌 Servidor offline - Já em modo offline');
        }
    }
    
    // Mostrar modal offline
    showOfflineModal() {
        const modal = document.getElementById('offlineModal');
        if (modal) {
            modal.classList.add('show');
            console.log('🔌 Modal offline exibido');
        }
    }
    
    // Ocultar modal offline
    hideOfflineModal() {
        const modal = document.getElementById('offlineModal');
        if (modal) {
            modal.classList.remove('show');
            console.log('🔌 Modal offline ocultado');
        }
    }
    
    // Iniciar jogo offline
    startOfflineGame() {
        console.log('🎮 Iniciando jogo offline');
        this.hideOfflineModal();
        
        // Resetar estado do jogo para modo offline
        this.resetGame();
        this.gameState = 'playing';
        
        // Mostrar mensagem de modo offline
        this.showMessage('🎮 Modo Offline Ativado - Use as teclas Q, W, E, R para jogar!');
        
        // Atualizar interface
        this.updateDisplay();
    }
    
    // Tentar reconectar ao servidor
    async attemptReconnect() {
        const reconnectStatus = document.getElementById('reconnectStatus');
        const reconnectBtn = document.getElementById('reconnectBtn');
        
        if (reconnectStatus && reconnectBtn) {
            reconnectStatus.textContent = 'Tentando reconectar...';
            reconnectStatus.className = 'reconnect-status loading';
            reconnectBtn.disabled = true;
            reconnectBtn.textContent = 'Conectando...';
        }
        
        try {
            const response = await fetch('/api/state');
            if (response.ok) {
                console.log('✅ Servidor reconectado com sucesso!');
                this.offlineMode = false;
                this.connectionAttempts = 0;
                
                if (reconnectStatus) {
                    reconnectStatus.textContent = '✅ Conectado!';
                    reconnectStatus.className = 'reconnect-status success';
                }
                
                if (reconnectBtn) {
                    reconnectBtn.disabled = false;
                    reconnectBtn.textContent = 'Tentar Reconectar';
                }
                
                // Atualizar status de conexão
                this.updateConnectionStatus(true);
                
                // Ocultar modal após 2 segundos
                setTimeout(() => {
                    this.hideOfflineModal();
                }, 2000);
                
                // Reiniciar polling normal
                this.restartNormalPolling();
                
            } else {
                throw new Error('Servidor respondeu com erro');
            }
        } catch (error) {
            console.log('❌ Falha na reconexão:', error);
            this.connectionAttempts++;
            
            if (reconnectStatus) {
                reconnectStatus.textContent = `❌ Falha na conexão (${this.connectionAttempts}/${this.maxConnectionAttempts})`;
                reconnectStatus.className = 'reconnect-status error';
            }
            
            if (reconnectBtn) {
                reconnectBtn.disabled = false;
                reconnectBtn.textContent = 'Tentar Novamente';
            }
            
            // Se excedeu tentativas, desabilitar auto-reconexão
            if (this.connectionAttempts >= this.maxConnectionAttempts) {
                console.log('⚠️ Máximo de tentativas de reconexão atingido');
                if (reconnectStatus) {
                    reconnectStatus.textContent = '⚠️ Máximo de tentativas atingido. Verifique o servidor.';
                }
            }
        }
    }
    
    // Atualizar status de conexão no modal
    updateConnectionStatus(isOnline) {
        const statusIndicator = document.querySelector('.status-indicator');
        const statusText = document.querySelector('.status-text');
        
        if (statusIndicator && statusText) {
            if (isOnline) {
                statusIndicator.className = 'status-indicator online';
                statusText.textContent = 'Servidor Conectado';
            } else {
                statusIndicator.className = 'status-indicator offline';
                statusText.textContent = 'Servidor Desconectado';
            }
        }
    }
    
    // Iniciar timer para tentar reconectar automaticamente
    startOfflineTimer() {
        if (this.offlineTimer) {
            clearInterval(this.offlineTimer);
        }
        
        this.offlineTimer = setInterval(() => {
            if (this.autoReconnect && this.connectionAttempts < this.maxConnectionAttempts) {
                console.log('🔄 Tentativa automática de reconexão...');
                this.attemptReconnect();
            } else {
                console.log('🛑 Auto-reconexão parada - Máximo de tentativas atingido');
                this.stopOfflineTimer();
            }
        }, 10000); // Tentar a cada 10 segundos
    }
    
    // Parar timer de reconexão
    stopOfflineTimer() {
        if (this.offlineTimer) {
            clearInterval(this.offlineTimer);
            this.offlineTimer = null;
        }
    }
    
    // Reiniciar polling normal após reconexão
    restartNormalPolling() {
        console.log('🔄 Reiniciando polling normal');
        // O polling será retomado automaticamente na próxima iteração
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
    
                    // Verificar comandos externos do Arduino Mega
    async checkExternalCommands() {
        try {
            const response = await fetch('/api/commands');
            if (response.ok) {
                const data = await response.json();
                const commands = data.commands || [];
                const gameState = data.game_state || {};
                
                // Atualizar estado do jogo do Arduino Mega
                if (gameState.player1_energy !== undefined) {
                    this.players[0].energy = gameState.player1_energy;
                    this.updateEnergyBar(1, gameState.player1_energy);
                }
                
                // Verificar se Arduino Mega está conectado
                if (gameState.game_active !== undefined) {
                    this.arduinoConnected = gameState.game_active;
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
    
                    // Processar comando externo do Arduino Mega
    processExternalCommand(command) {
        // Processar comando externo
        
        switch (command.type) {
            case 'pedal_energy':
                // Energia do Arduino Mega para jogador 1
                if (command.player_id === 1) {
                    const player = this.players[0];
                    const oldEnergy = player.energy;
                    
                    // Atualizar energia
                    player.energy = command.energy;
                    
                    // Marcar como pedalando quando receber energia do Arduino Mega
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
                // Vitória declarada pelo Arduino Mega
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
                // Arduino Mega parou de pedalar
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
    
    // Atualizar status do Arduino Mega
    updateArduinoStatus(connected) {
        const statusElement = document.getElementById('arduinoStatus');
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
    
    // Atualizar barra de energia com animação GSAP orgânica
    updateEnergyBar(playerId, energy) {
        const energyBar = document.getElementById(`energy${playerId}`);
        if (energyBar) {
            // Converter energia para altura (0-100%)
            const height = Math.min(100, Math.max(0, energy));
            const currentHeight = parseFloat(energyBar.style.height) || 0;
            
            // Determinar se é ganho ou perda de energia
            const isGaining = height > currentHeight;
            const energyChange = Math.abs(height - currentHeight);
            
            // Configurar animação baseada no tipo de mudança
            const animationConfig = {
                height: `${height}%`,
                duration: isGaining ? 1.5 : 2.0,
                ease: isGaining ? "power2.out" : "power1.out",
                onStart: () => {
                    // Efeito de brilho durante animação
                    energyBar.classList.add('charging');
                    
                    // Adicionar efeito de "pulse" suave para ganhos grandes
                    if (isGaining && energyChange > 10) {
                        gsap.to(energyBar, {
                            scale: 1.02,
                            duration: 0.4,
                            ease: "power1.out",
                            yoyo: true,
                            repeat: 1
                        });
                    }
                },
                onUpdate: () => {
                    // Efeito de ondulação durante animação
                    if (isGaining) {
                        this.addRippleEffect(energyBar);
                    }
                },
                onComplete: () => {
                    energyBar.classList.remove('charging');
                    
                    // Criar partículas de energia para ganhos
                    if (isGaining && energyChange > 5) {
                        this.createEnergyParticles(energyBar, height);
                    }
                    
                    // Efeito de estabilização suave
                    gsap.to(energyBar, {
                        scale: 1,
                        duration: 0.6,
                        ease: "power1.out"
                    });
                }
            };
            
            // Aplicar animação GSAP com easing suave
            gsap.to(energyBar, {
                ...animationConfig,
                ease: isGaining ? "power2.out" : "power1.out",
                // Adicionar suavização extra
                smoothChildTiming: true,
                overwrite: "auto"
            });
        }
    }
    
    // Adicionar efeito de ondulação
    addRippleEffect(energyBar) {
        const ripple = document.createElement('div');
        ripple.className = 'energy-ripple';
        ripple.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
            border-radius: 12px;
            pointer-events: none;
            opacity: 0;
        `;
        
        energyBar.appendChild(ripple);
        
        gsap.to(ripple, {
            opacity: 1,
            scale: 1.2,
            duration: 0.3,
            ease: "power2.out",
            onComplete: () => {
                ripple.remove();
            }
        });
    }
    
    // Criar partículas de energia
    createEnergyParticles(energyBar, height) {
        const particleCount = Math.floor(height / 10); // Mais partículas para energia alta
        const container = energyBar.querySelector('.energy-particles') || this.createParticleContainer(energyBar);
        
        for (let i = 0; i < particleCount; i++) {
            setTimeout(() => {
                this.createSingleParticle(container, energyBar);
            }, i * 50); // Delay entre partículas
        }
    }
    
    // Criar container de partículas
    createParticleContainer(energyBar) {
        const container = document.createElement('div');
        container.className = 'energy-particles';
        energyBar.appendChild(container);
        return container;
    }
    
    // Criar partícula individual
    createSingleParticle(container, energyBar) {
        const particle = document.createElement('div');
        particle.className = 'energy-particle';
        
        const rect = energyBar.getBoundingClientRect();
        const startX = Math.random() * rect.width;
        const startY = rect.height;
        
        particle.style.cssText = `
            left: ${startX}px;
            bottom: 0;
            transform: translateY(0);
        `;
        
        container.appendChild(particle);
        
        // Animação da partícula
        gsap.to(particle, {
            y: -rect.height * 2,
            x: startX + (Math.random() - 0.5) * 50,
            opacity: 0,
            scale: 0,
            duration: 1.5,
            ease: "power2.out",
            onComplete: () => {
                particle.remove();
            }
        });
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
        console.log('✅ Sistema de pedalada Arduino Mega inicializado');
        
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
        
        // Enviar pedalada para o servidor
        this.sendPedalToServer(playerId);
        
        // Atualizar display
        this.updateDisplay();
    }
    
    // Enviar pedalada para o servidor
    async sendPedalToServer(playerId) {
        try {
            const response = await fetch('/api/pedal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    player: playerId
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`⌨️ Pedalada enviada para servidor: Jogador ${playerId}, Energia: ${data.energy}%`);
            } else {
                console.log(`❌ Erro ao enviar pedalada: ${response.status}`);
            }
        } catch (error) {
            console.log(`❌ Erro de conexão ao enviar pedalada: ${error}`);
        }
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
            
            if (energyFill) {
                energyFill.style.height = `${energyPercentage}%`;
                energyFill.style.bottom = '0'; // Garantir que cresça de baixo
                
                // Debug: log das mudanças de energia
                if (player.energy > 0) {
                    console.log(`📊 Jogador ${player.id}: Energia = ${player.energy}% (${energyPercentage}% da barra)`);
                }
            } else {
                console.error(`❌ Elemento energy${player.id} não encontrado!`);
            }
            
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
        
        // Atualizar status de conexão na interface
        this.updateConnectionStatusDisplay();
    }
    
    // Atualizar status de conexão na interface principal
    updateConnectionStatusDisplay() {
        // Adicionar indicador de status na interface principal
        let statusIndicator = document.getElementById('connectionStatusIndicator');
        
        if (!statusIndicator) {
            // Criar indicador se não existir
            const gameControls = document.querySelector('.game-controls');
            if (gameControls) {
                statusIndicator = document.createElement('div');
                statusIndicator.id = 'connectionStatusIndicator';
                statusIndicator.className = 'connection-status-main';
                gameControls.appendChild(statusIndicator);
            }
        }
        
        if (statusIndicator) {
            if (this.offlineMode) {
                statusIndicator.innerHTML = `
                    <div class="status-main offline">
                        <span class="status-dot offline"></span>
                        <span class="status-text">Modo Offline</span>
                        <button class="btn btn-small" id="offlineControlsBtn">🔧 Controles</button>
                    </div>
                `;
                
                // Adicionar event listener para o botão de controles
                const controlsBtn = statusIndicator.querySelector('#offlineControlsBtn');
                if (controlsBtn) {
                    controlsBtn.addEventListener('click', () => this.showOfflineModal());
                }
            } else {
                statusIndicator.innerHTML = `
                    <div class="status-main online">
                        <span class="status-dot online"></span>
                        <span class="status-text">Servidor Conectado</span>
                    </div>
                `;
            }
        }
        
        // Debug: log do status de conexão
        console.log(`🔌 Status de conexão atualizado: offlineMode=${this.offlineMode}`);
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
            
            // CONGELAR TODOS OS JOGADORES - parar todas as atividades
            this.freezeAllPlayers();
            console.log('❄️ Todos os jogadores congelados - Jogo finalizado');
            
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
        
        // Reiniciar jogo automaticamente após 8 segundos (tempo para animação completa)
        setTimeout(() => {
            console.log('🔄 Reiniciando jogo automaticamente após animação...');
            this.showMessage('🔄 Reiniciando jogo em 3...');
            
            // Contador regressivo
            setTimeout(() => {
                this.showMessage('🔄 Reiniciando jogo em 2...');
                setTimeout(() => {
                    this.showMessage('🔄 Reiniciando jogo em 1...');
                    setTimeout(() => {
                        console.log('🔄 Executando RESET COMPLETO automático...');
                        this.completeReset();
                        this.showMessage('🎮 Jogo reiniciado completamente! Qualquer pedalada inicia uma nova partida!');
                    }, 1000);
                }, 1000);
            }, 1000);
        }, 8000);
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
        console.log('🔄 Iniciando RESET COMPLETO...');
        
        // EXECUTAR RESET COMPLETO QUE GARANTE ESTADO INICIAL
        this.completeReset();
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
            
            // REMOVER CLASSES DE CONGELAMENTO
            playerBar.classList.remove('frozen');
            energyFill.classList.remove('frozen');
            
            // Restaurar nome e pontuação
            playerName.innerHTML = playerName.textContent.replace(/👑 /g, '').replace(/ 👑/g, '');
            playerName.style.color = '';
            playerName.style.fontWeight = '';
            
            playerScore.style.animation = '';
            playerScore.style.transform = '';
            
            // RESETAR BARRA DE ENERGIA VISUALMENTE
            if (energyFill) {
                energyFill.style.width = '0%';
                console.log(`🔄 Barra visual do Jogador ${player.id} resetada para 0%`);
            }
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
    
    // 🔧 Abrir configurador serial
    openSerialConfig() {
        console.log('🔧 Abrindo configurador serial...');
        const url = '/serial_config.html';
        console.log(`🔧 URL: ${url}`);
        
        // Tentar abrir em nova janela
        const newWindow = window.open(url, '_blank');
        
        // Se falhar, abrir na mesma aba
        if (!newWindow) {
            console.log('🔧 Abrindo na mesma aba...');
            window.location.href = url;
        }
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
    
    async applyConfig() {
        // Aplicar novas configurações
        this.energyGainRate = parseFloat(document.getElementById('energyGainRate').value);
        this.energyDecayRate = parseFloat(document.getElementById('energyDecayRate').value);
        this.ledStrobeRate = parseInt(document.getElementById('ledStrobeRate').value);
        
        // Atualizar taxa de strobe dos LEDs
        this.updateStrobeRate();
        
        // Salvar configurações no servidor
        try {
            const response = await fetch('/api/config/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    energy_gain_rate: this.energyGainRate,
                    energy_decay_rate: this.energyDecayRate,
                    led_strobe_rate: this.ledStrobeRate
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Configurações salvas no servidor:', result);
                this.showMessage('✅ Configurações aplicadas e salvas no servidor!');
            } else {
                throw new Error('Erro ao salvar no servidor');
            }
        } catch (error) {
            console.log('⚠️ Erro ao salvar no servidor, salvando localmente:', error);
            // Fallback para salvar localmente
            this.saveConfig();
            this.showMessage('⚠️ Configurações salvas localmente (servidor offline)');
        }
        
        this.hideConfigMenu();
        
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
    
    async loadConfig() {
        try {
            // Primeiro tentar carregar do servidor
            const response = await fetch('/api/config');
            if (response.ok) {
                const serverConfig = await response.json();
                this.energyGainRate = serverConfig.energy_gain_rate || this.defaultConfig.energyGainRate;
                this.energyDecayRate = serverConfig.energy_decay_rate || this.defaultConfig.energyDecayRate;
                this.ledStrobeRate = serverConfig.led_strobe_rate || this.defaultConfig.ledStrobeRate;
                console.log('⚙️ Configurações carregadas do servidor:', serverConfig);
                return;
            }
        } catch (error) {
            console.log('⚠️ Servidor não disponível, carregando configurações locais');
        }
        
        // Fallback para configurações locais
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
    
    // ❄️ CONGELAR TODOS OS JOGADORES
    freezeAllPlayers() {
        console.log('❄️ CONGELANDO TODOS OS JOGADORES...');
        
        this.players.forEach(player => {
            // Parar todas as atividades
            player.isPedaling = false;
            player.lastPedalTime = 0;
            
            // CONGELAR BARRAS VISUALMENTE - adicionar classe de congelamento
            const playerBar = document.getElementById(`player${player.id}`);
            if (playerBar) {
                playerBar.classList.add('frozen');
                const energyFill = playerBar.querySelector('.energy-fill');
                if (energyFill) {
                    energyFill.classList.add('frozen');
                    console.log(`❄️ Barra do Jogador ${player.id} congelada visualmente`);
                }
            }
            
            // Desabilitar controles de teclado
            if (player.id === 1) {
                // Jogador 1 (Arduino Mega) - parar decaimento
                this.stopEnergyDecay();
            }
            
            console.log(`❄️ Jogador ${player.id} congelado - atividades paradas`);
        });
        
        // Parar todos os timers ativos
        if (this.decayTimer) {
            clearInterval(this.decayTimer);
            this.decayTimer = null;
        }
        
        // Marcar jogo como finalizado
        this.gameState = 'finished';
        console.log('❄️ Jogo marcado como finalizado - congelamento completo');
    }
    
    // 🔄 RESETAR TODAS AS BARRAS VISUAIS
    resetAllEnergyBars() {
        console.log('🔄 RESETANDO TODAS AS BARRAS VISUAIS...');
        
        this.players.forEach(player => {
            const playerBar = document.getElementById(`player${player.id}`);
            if (playerBar) {
                // REMOVER CLASSE DE CONGELAMENTO
                playerBar.classList.remove('frozen');
                
                const energyFill = playerBar.querySelector('.energy-fill');
                if (energyFill) {
                    // REMOVER CLASSE DE CONGELAMENTO
                    energyFill.classList.remove('frozen');
                    
                    // FORÇAR RESET VISUAL
                    energyFill.style.width = '0%';
                    energyFill.style.transition = 'none'; // Sem animação
                    
                    // Forçar reflow para aplicar mudança imediatamente
                    energyFill.offsetHeight;
                    
                    console.log(`🔄 Barra visual do Jogador ${player.id} resetada para 0%`);
                }
            }
        });
        
        console.log('🔄 Todas as barras foram resetadas visualmente');
    }
    
    // 🔄 FORÇAR RESET NO SERVIDOR
    forceServerReset() {
        console.log('🔄 Forçando reset no servidor...');
        
        // Resetar energia no servidor
        fetch('/api/reset-game')
            .then(response => response.text())
            .then(data => {
                console.log('🔄 Reset forçado no servidor executado!');
                
                // Verificar se o reset funcionou
                setTimeout(() => {
                    this.verifyServerReset();
                }, 200);
            })
            .catch(error => {
                console.log('❌ Erro no reset forçado: ' + error);
            });
    }
    
    // 🔍 VERIFICAR SE O RESET NO SERVIDOR FUNCIONOU
    verifyServerReset() {
        fetch('/api/state')
            .then(response => response.json())
            .then(gameState => {
                console.log('🔍 Verificando reset do servidor...');
                console.log(`🔍 Estado do servidor: Jogo=${gameState.game_active}, Energia=${gameState.player1_energy}`);
                
                if (gameState.player1_energy > 0) {
                    console.log('⚠️ Servidor ainda não foi resetado! Forçando novamente...');
                    this.forceServerReset();
                } else {
                    console.log('✅ Servidor resetado com sucesso!');
                }
            })
            .catch(error => {
                console.log('❌ Erro ao verificar reset: ' + error);
            });
    }
    
    // 🚀 FORÇAR RESET IMEDIATO NO DOM
    forceDOMReset() {
        console.log('🚀 Forçando reset imediato no DOM...');
        
        // Resetar todas as barras de energia diretamente
        for (let i = 1; i <= 4; i++) {
            const playerBar = document.getElementById(`player${i}`);
            if (playerBar) {
                // Resetar barra de energia
                const energyFill = playerBar.querySelector('.energy-fill');
                if (energyFill) {
                    energyFill.style.cssText = `
                        width: 0% !important;
                        transition: none !important;
                        opacity: 1 !important;
                    `;
                    console.log(`🚀 Barra do Jogador ${i} resetada no DOM (forçado)`);
                }
                
                // Resetar status
                const playerStatus = playerBar.querySelector('.player-status');
                if (playerStatus) {
                    playerStatus.textContent = 'Parado';
                    playerStatus.style.color = '#cccccc';
                }
                
                // Resetar pontuação
                const playerScore = playerBar.querySelector('.player-score');
                if (playerScore) {
                    playerScore.textContent = '0';
                }
                
                // Remover todas as classes especiais
                playerBar.className = 'player-bar';
                if (energyFill) {
                    energyFill.className = 'energy-fill';
                }
            }
        }
        
        // Forçar reflow do DOM
        document.body.offsetHeight;
        console.log('🚀 Reset do DOM executado com sucesso!');
    }
    
    // 🔥 RESET FINAL - GARANTIR TUDO
    forceFinalReset() {
        console.log('🔥 EXECUTANDO RESET FINAL - GARANTINDO TUDO...');
        
        // 1. RESETAR VALORES INTERNOS
        this.players.forEach(player => {
            player.energy = 0;
            player.score = 0;
            player.isPedaling = false;
            player.lastPedalTime = 0;
            console.log(`🔥 Jogador ${player.id} resetado internamente`);
        });
        
        // 2. RESETAR BARRAS VISUAIS COM FORÇA MÁXIMA
        for (let i = 1; i <= 4; i++) {
            const playerBar = document.getElementById(`player${i}`);
            if (playerBar) {
                // Resetar barra de energia com !important
                const energyFill = playerBar.querySelector('.energy-fill');
                if (energyFill) {
                    energyFill.setAttribute('style', 'width: 0% !important; transition: none !important;');
                    console.log(`🔥 Barra do Jogador ${i} resetada com força máxima`);
                }
                
                // Resetar status
                const playerStatus = playerBar.querySelector('.player-status');
                if (playerStatus) {
                    playerStatus.textContent = 'Parado';
                    playerStatus.style.color = '#cccccc';
                }
                
                // Resetar pontuação
                const playerScore = playerBar.querySelector('.player-score');
                if (playerScore) {
                    playerScore.textContent = '0';
                }
                
                // Remover TODAS as classes
                playerBar.className = 'player-bar';
                if (energyFill) {
                    energyFill.className = 'energy-fill';
                }
            }
        }
        
        // 3. RESETAR ESTADO DO JOGO
        this.gameState = 'waiting';
        
        // 4. FORÇAR REFLOW E VERIFICAR
        document.body.offsetHeight;
        
        // 5. VERIFICAÇÃO FINAL
        this.verifyFinalReset();
        
        console.log('🔥 RESET FINAL EXECUTADO COM SUCESSO!');
    }
    
    // 🔍 VERIFICAÇÃO FINAL DO RESET
    verifyFinalReset() {
        console.log('🔍 VERIFICAÇÃO FINAL DO RESET...');
        
        let allReset = true;
        
        // Verificar valores internos
        this.players.forEach(player => {
            if (player.energy !== 0 || player.isPedaling !== false) {
                console.log(`⚠️ Jogador ${player.id} não foi resetado completamente!`);
                allReset = false;
            }
        });
        
        // Verificar barras visuais
        for (let i = 1; i <= 4; i++) {
            const playerBar = document.getElementById(`player${i}`);
            if (playerBar) {
                const energyFill = playerBar.querySelector('.energy-fill');
                if (energyFill) {
                    const computedWidth = window.getComputedStyle(energyFill).width;
                    if (computedWidth !== '0px') {
                        console.log(`⚠️ Barra do Jogador ${i} não está em 0%: ${computedWidth}`);
                        allReset = false;
                    }
                }
            }
        }
        
        if (allReset) {
            console.log('✅ VERIFICAÇÃO FINAL: TUDO FOI RESETADO COM SUCESSO!');
        } else {
            console.log('❌ VERIFICAÇÃO FINAL: ALGUNS ELEMENTOS NÃO FORAM RESETADOS!');
            // Forçar reset novamente
            setTimeout(() => {
                this.forceFinalReset();
            }, 500);
        }
    }
    
    // 🚀 RESET COMPLETO - VOLTAR AO ESTADO INICIAL EXATO
    completeReset() {
        console.log('🚀 EXECUTANDO RESET COMPLETO - VOLTANDO AO ESTADO INICIAL...');
        
        // 1. PARAR TODOS OS TIMERS E PROCESSOS
        this.stopAllTimers();
        
        // 2. RESETAR ESTADO INTERNO COMPLETAMENTE
        this.gameState = 'waiting';
        this.gameTime = 0;
        this.arduinoConnected = false;
        this.lastPedalCount = 0;
        this.lastPedalTime = 0;
        this.debugCounter = 0;
        
        // 3. RESETAR TODOS OS JOGADORES PARA VALORES INICIAIS
        this.players = [
            { id: 1, key: 'KeyQ', energy: 0, score: 0, isPedaling: false, lastPedalTime: 0 },
            { id: 2, key: 'KeyW', energy: 0, score: 0, isPedaling: false, lastPedalTime: 0 },
            { id: 3, key: 'KeyE', energy: 0, score: 0, isPedaling: false, lastPedalTime: 0 },
            { id: 4, key: 'KeyR', energy: 0, score: 0, isPedaling: false, lastPedalTime: 0 }
        ];
        
        // 4. RESETAR LEDS VIRTUAIS
        this.resetAllLeds();
        
        // 5. RESETAR CONFIGURAÇÕES PARA PADRÃO
        this.useDefaultConfig();
        
        // 6. RESETAR RELATÓRIOS
        this.currentGameReport = null;
        
        // 7. RESETAR DOM COMPLETAMENTE
        this.resetDOMCompletely();
        
        // 8. RESETAR SERVIDOR
        this.resetServerCompletely();
        
        // 9. RESTAURAR CONTROLES
        this.restoreControls();
        
        // 10. VERIFICAÇÃO FINAL
        setTimeout(() => {
            this.verifyCompleteReset();
        }, 100);
        
        console.log('🚀 RESET COMPLETO EXECUTADO!');
    }
    
    // 🛑 PARAR TODOS OS TIMERS
    stopAllTimers() {
        console.log('🛑 Parando todos os timers...');
        
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
        
        if (this.decayTimer) {
            clearInterval(this.decayTimer);
            this.decayTimer = null;
        }
        
        if (this.autoRestartTimer) {
            clearInterval(this.autoRestartTimer);
            this.autoRestartTimer = null;
        }
        
        // Parar todos os timers de LED
        Object.values(this.virtualLeds.strobeTimers).forEach(timer => {
            if (timer) clearInterval(timer);
        });
        this.virtualLeds.strobeTimers = {};
        
        console.log('🛑 Todos os timers parados!');
    }
    
    // 🎨 RESETAR DOM COMPLETAMENTE
    resetDOMCompletely() {
        console.log('🎨 Resetando DOM completamente...');
        
        // Resetar todas as barras de energia
        for (let i = 1; i <= 4; i++) {
            const playerBar = document.getElementById(`player${i}`);
            if (playerBar) {
                // Resetar barra de energia
                const energyFill = playerBar.querySelector('.energy-fill');
                if (energyFill) {
                    // FORÇAR RESET COM ATRIBUTOS
                    energyFill.removeAttribute('style');
                    energyFill.style.cssText = `
                        width: 0% !important;
                        transition: none !important;
                        opacity: 1 !important;
                        background: linear-gradient(90deg, #ff6b6b 0%, #4ecdc4 100%) !important;
                    `;
                }
                
                // Resetar status
                const playerStatus = playerBar.querySelector('.player-status');
                if (playerStatus) {
                    playerStatus.textContent = 'Aguardando...';
                    playerStatus.style.color = '#cccccc';
                    playerStatus.style.fontWeight = 'normal';
                }
                
                // Resetar pontuação
                const playerScore = playerBar.querySelector('.player-score');
                if (playerScore) {
                    playerScore.textContent = '0';
                    playerScore.style.animation = '';
                    playerScore.style.transform = '';
                }
                
                // Resetar nome
                const playerName = playerBar.querySelector('.player-name');
                if (playerName) {
                    playerName.innerHTML = `Jogador ${i}`;
                    playerName.style.color = '';
                    playerName.style.fontWeight = '';
                }
                
                // REMOVER TODAS AS CLASSES ESPECIAIS
                playerBar.className = 'player-bar';
                if (energyFill) {
                    energyFill.className = 'energy-fill';
                }
                
                // Forçar reflow
                playerBar.offsetHeight;
            }
        }
        
        // Resetar botões
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.disabled = false;
            startBtn.textContent = 'Iniciar Jogo';
        }
        
        // Remover mensagens de vencedor
        this.removeWinnerEffects();
        
        console.log('🎨 DOM resetado completamente!');
    }
    
    // 🌐 RESETAR SERVIDOR COMPLETAMENTE
    resetServerCompletely() {
        console.log('🌐 Resetando servidor completamente...');
        
        // Resetar jogo no servidor
        fetch('/api/reset-game')
            .then(response => response.text())
            .then(data => {
                console.log('🌐 Servidor resetado!');
                
                // Verificar se foi resetado
                setTimeout(() => {
                    this.verifyServerReset();
                }, 200);
            })
            .catch(error => {
                console.log('❌ Erro ao resetar servidor: ' + error);
            });
    }
    
    // 🎮 RESTAURAR CONTROLES
    restoreControls() {
        console.log('🎮 Restaurando controles...');
        
        // Habilitar botão de início
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.disabled = false;
            startBtn.textContent = 'Iniciar Jogo';
        }
        
        // Restaurar configurações visuais
        this.updateConfigDisplay();
        
        console.log('🎮 Controles restaurados!');
    }
    
    // 🔍 VERIFICAÇÃO COMPLETA DO RESET
    verifyCompleteReset() {
        console.log('🔍 VERIFICAÇÃO COMPLETA DO RESET...');
        
        let allGood = true;
        
        // Verificar estado interno
        if (this.gameState !== 'waiting') {
            console.log('⚠️ Estado do jogo não é "waiting"');
            allGood = false;
        }
        
        // Verificar jogadores
        this.players.forEach(player => {
            if (player.energy !== 0 || player.score !== 0 || player.isPedaling !== false) {
                console.log(`⚠️ Jogador ${player.id} não foi resetado: energy=${player.energy}, score=${player.score}, isPedaling=${player.isPedaling}`);
                allGood = false;
            }
        });
        
        // Verificação simplificada das barras visuais
        for (let i = 1; i <= 4; i++) {
            const playerBar = document.getElementById(`player${i}`);
            if (playerBar) {
                const energyFill = playerBar.querySelector('.energy-fill');
                if (energyFill) {
                    // Verificar se a barra está próxima de 0% (tolerância de 5px)
                    const computedWidth = window.getComputedStyle(energyFill).width;
                    const widthValue = parseFloat(computedWidth);
                    if (widthValue > 5) {
                        console.log(`⚠️ Barra do Jogador ${i} não está próxima de 0%: ${computedWidth}`);
                        allGood = false;
                    }
                }
                
                const playerStatus = playerBar.querySelector('.player-status');
                if (playerStatus && playerStatus.textContent !== 'Aguardando...') {
                    console.log(`⚠️ Status do Jogador ${i} não é "Aguardando...": ${playerStatus.textContent}`);
                    allGood = false;
                }
            }
        }
        
        if (allGood) {
            console.log('✅ VERIFICAÇÃO COMPLETA: JOGO VOLTOU AO ESTADO INICIAL PERFEITAMENTE!');
            this.showMessage('Jogo resetado completamente!');
        } else {
            console.log('❌ VERIFICAÇÃO COMPLETA: ALGUNS ELEMENTOS NÃO FORAM RESETADOS!');
            // Não tentar reset novamente para evitar loop infinito
            this.showMessage('Reset parcial - alguns elementos podem precisar de refresh da página');
        }
    }
    
    // ⏰ PARAR DECAIMENTO DE ENERGIA
    stopEnergyDecay() {
        console.log('⏰ Parando decaimento de energia...');
        
        if (this.decayTimer) {
            clearInterval(this.decayTimer);
            this.decayTimer = null;
            console.log('⏰ Timer de decaimento parado!');
        }
    }
    

}

// Inicializar o jogo quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new BikeJJGame();
});
