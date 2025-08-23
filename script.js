class BikeJJGame {
    constructor() {
        this.gameState = 'waiting'; // waiting, playing, finished
        this.gameTime = 0;
        this.gameTimer = null;
        
        // Configurações padrão
        this.defaultConfig = {
            energyDecayRate: 2.5,
            energyGainRate: 3,
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
        console.log('🚀 Inicializando BikeJJ Game...');
        console.log('👥 Players configurados:', this.players);
        
        this.setupEventListeners();
        this.setupGameLoop();
        this.loadGameReports(); // Carregar relatórios salvos
        this.setupVirtualLeds(); // Configurar LEDs virtuais
        this.updateDisplay();
        
        console.log('✅ BikeJJ Game inicializado com sucesso!');
        console.log('🎮 Estado inicial:', this.gameState);
    }
    
    setupEventListeners() {
        console.log('🔧 Configurando event listeners...');
        
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
        
        console.log('✅ Event listeners configurados com sucesso!');
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
    
    // Atualizar taxa de strobe nos LEDs
    updateStrobeRate() {
        const rate = this.ledStrobeRate || 200;
        document.documentElement.style.setProperty('--strobe-rate', `${rate}ms`);
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
            
            console.log(`🔴 LED do Jogador ${playerId} ativado com strobe`);
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
        
        console.log('🔴 Todos os LEDs resetados');
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
                console.log(`📡 UDP enviado: ${type} - Jogador ${playerId}`);
            } else {
                console.error('❌ Erro ao enviar UDP:', response.statusText);
            }
        } catch (error) {
            console.error('❌ Erro na comunicação UDP:', error);
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
        
        // Log das configurações do jogo
        console.log(`🎮 INICIANDO JOGO - Configurações:`);
        console.log(`   Max Energy: ${this.maxEnergy} (tipo: ${typeof this.maxEnergy})`);
        console.log(`   Taxa de Ganho: ${this.energyGainRate} (tipo: ${typeof this.energyGainRate})`);
        console.log(`   Taxa de Decaimento: ${this.energyDecayRate} (tipo: ${typeof this.energyDecayRate})`);
        console.log(`   Game State: ${this.gameState}`);
        
        // Iniciar relatório da partida atual
        this.startGameReport();
        
        // Reset das barras de energia
        this.players.forEach(player => {
            player.energy = 0;
            player.score = 0;
            player.isPedaling = false;
            console.log(`   Jogador ${player.id}: Energia inicializada para ${player.energy}`);
        });
        
        document.getElementById('startBtn').disabled = true;
        document.getElementById('startBtn').textContent = 'Jogo em Andamento';
        
        this.updateDisplay();
        this.showMessage('Jogo iniciado! Use Q, W, E, R para pedalar! Primeiro a 100% vence!');
    }
    
    handleKeyDown(e) {
        console.log('🔑 Tecla pressionada:', e.code, 'Game State:', this.gameState);
        
        if (this.gameState !== 'playing') {
            console.log('❌ Jogo não está rodando');
            return;
        }
        
        const player = this.players.find(p => p.key === e.code);
        if (player) {
            console.log('✅ Jogador encontrado:', player.id);
            this.pedal(player.id);
        } else {
            console.log('❌ Jogador não encontrado para tecla:', e.code);
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
        console.log('🚴 Pedalando jogador:', playerId);
        
        const player = this.players.find(p => p.id === playerId);
        if (!player) {
            console.log('❌ Jogador não encontrado:', playerId);
            return;
        }
        
        const now = Date.now();
        
        // Evitar spam de inputs (mínimo 50ms entre inputs)
        if (now - player.lastPedalTime < 50) {
            console.log('⏱️ Muito rápido, ignorando input');
            return;
        }
        
        player.lastPedalTime = now;
        player.isPedaling = true;
        
        // Aumentar energia
        const oldEnergy = player.energy;
        player.energy = Math.min(this.maxEnergy, player.energy + this.energyGainRate);
        
        // Adicionar pontuação baseada na energia atual
        const energyBonus = Math.floor(player.energy / 20); // Reduzido o bônus
        player.score += 0.5 + energyBonus; // Reduzido o ganho base
        
        console.log(`⚡ Jogador ${player.id}: Energia ${oldEnergy.toFixed(3)} → ${player.energy.toFixed(3)}/${this.maxEnergy}, Pontuação: ${player.score.toFixed(2)}`);
        console.log(`🔍 Taxa de ganho: ${this.energyGainRate}, Max Energy: ${this.maxEnergy}`);
        
        // Verificar se atingiu energia máxima
        if (player.energy >= this.maxEnergy) {
            console.log(`🏆 VITÓRIA IMEDIATA! Jogador ${player.id} atingiu energia máxima!`);
            console.log(`🔍 Energia final: ${player.energy.toFixed(3)}, Max: ${this.maxEnergy}`);
            this.endGameWithWinner(player);
            return;
        }
        
        // Registrar evento de pedalada no relatório
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
            // Debug: mostrar energia atual a cada frame
            if (player.energy > 95) {
                console.log(`🚨 ALERTA ALTO! Jogador ${player.id}: ${player.energy.toFixed(3)}/${this.maxEnergy}`);
            }
            
            // Decaimento natural da energia
            if (!player.isPedaling) {
                const oldEnergy = player.energy;
                player.energy = Math.max(0, player.energy - (this.energyDecayRate / 60));
                if (oldEnergy !== player.energy) {
                    console.log(`📉 Jogador ${player.id}: Decaimento ${oldEnergy.toFixed(3)} → ${player.energy.toFixed(3)}`);
                }
            }
            
            // Atualizar pontuação baseada na energia constante
            if (player.energy > 60 && player.isPedaling) {
                player.score += 0.05; // Reduzido o bônus de consistência
            }
            
            // Verificar se algum jogador atingiu energia máxima (vitória instantânea)
            if (player.energy >= this.maxEnergy) {
                console.log(`🏆 VITÓRIA! Jogador ${player.id} atingiu energia máxima: ${player.energy.toFixed(3)}/${this.maxEnergy}`);
                console.log(`🔍 Tipo de energia: ${typeof player.energy}, Tipo de maxEnergy: ${typeof this.maxEnergy}`);
                console.log(`🔍 Comparação: ${player.energy} >= ${this.maxEnergy} = ${player.energy >= this.maxEnergy}`);
                this.endGameWithWinner(player);
                return;
            }
            
            // Debug: mostrar energia atual
            if (player.energy > 90) {
                console.log(`⚠️ Jogador ${player.id} com energia alta: ${player.energy.toFixed(3)}/${this.maxEnergy}`);
            }
        });
        
        // Atualizar relatório em tempo real
        this.updateGameReport();
        this.updateDisplay();
    }
    
    updateDisplay() {
        this.players.forEach(player => {
            // Atualizar barra de energia
            const energyFill = document.getElementById(`energy${player.id}`);
            const energyPercentage = (player.energy / this.maxEnergy) * 100;
            energyFill.style.height = `${energyPercentage}%`;
            
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
        
        // Mostrar resumo da partida
        this.showGameSummary();
        
        this.currentGameReport = null;
    }
    
    saveGameReports() {
        try {
            localStorage.setItem('bikejj_game_reports', JSON.stringify(this.gameReports));
            console.log('📊 Relatórios de partidas salvos:', this.gameReports.length);
        } catch (error) {
            console.error('❌ Erro ao salvar relatórios:', error);
        }
    }
    
    loadGameReports() {
        try {
            const savedReports = localStorage.getItem('bikejj_game_reports');
            if (savedReports) {
                this.gameReports = JSON.parse(savedReports);
                console.log('📊 Relatórios de partidas carregados:', this.gameReports.length);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar relatórios:', error);
            this.gameReports = [];
        }
    }
    
    showGameSummary() {
        const report = this.gameReports[this.gameReports.length - 1];
        if (!report) return;
        
        const summary = `
🏆 RESUMO DA PARTIDA #${report.gameId}

⏰ Duração: ${Math.round(report.duration / 1000)}s
👑 Vencedor: Jogador ${report.winner.id}
📊 Pontuação: ${report.winner.score}
⚡ Energia Final: ${report.winner.energy.toFixed(1)}%
🎮 Tipo de Vitória: ${report.winner.victoryType === 'energy_max' ? 'Energia Máxima' : 'Tempo'}

📈 ESTATÍSTICAS:
• Total de pedaladas: ${report.statistics.totalPedals}
• Energia máxima atingida: ${report.statistics.maxEnergyReached.toFixed(1)}%
• Energia média: ${report.statistics.averageEnergy.toFixed(1)}%

⚙️ CONFIGURAÇÕES:
• Geração: ${report.gameConfig.energyGainRate}% por pedalada
• Decaimento: ${report.gameConfig.energyDecayRate}% por segundo
        `;
        
        console.log(summary);
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
        
        let reportsText = `📊 RELATÓRIOS DE PARTIDAS (${this.gameReports.length} partidas)\n\n`;
        
        this.gameReports.forEach((report, index) => {
            const startDate = new Date(report.startTime).toLocaleString('pt-BR');
            const duration = Math.round(report.duration / 1000);
            
            reportsText += `🎮 PARTIDA #${index + 1} (ID: ${report.gameId})\n`;
            reportsText += `📅 Data: ${startDate}\n`;
            reportsText += `⏱️ Duração: ${duration}s\n`;
            reportsText += `🏆 Vencedor: Jogador ${report.winner.id}\n`;
            reportsText += `📊 Pontuação: ${report.winner.score}\n`;
            reportsText += `⚡ Energia: ${report.winner.energy.toFixed(1)}%\n`;
            reportsText += `🎯 Tipo: ${report.winner.victoryType === 'energy_max' ? 'Energia Máxima' : 'Tempo'}\n`;
            reportsText += `📈 Total Pedaladas: ${report.statistics.totalPedals}\n\n`;
        });
        
        console.log(reportsText);
        this.showMessage(`📊 ${this.gameReports.length} partidas registradas! Ver console para detalhes.`);
    }
    
    resetGame() {
        this.gameState = 'waiting';
        
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
            console.log('⚙️ Configurações salvas:', config);
        } catch (error) {
            console.error('❌ Erro ao salvar configurações:', error);
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
                    console.log('⚙️ Configurações carregadas:', config);
                } else {
                    console.log('⚠️ Configurações inválidas, usando padrões');
                    this.useDefaultConfig();
                }
            } else {
                console.log('📝 Nenhuma configuração salva, usando padrões');
                this.useDefaultConfig();
            }
        } catch (error) {
            console.error('❌ Erro ao carregar configurações:', error);
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

// Adicionar instruções de uso
console.log(`
🚴 BikeJJ - Competição de Energia com Bicicletas

🎮 CONTROLES:
- Q: Jogador 1
- W: Jogador 2  
- E: Jogador 3
- R: Jogador 4

📋 COMO JOGAR:
1. Clique em "Iniciar Jogo"
2. Use as teclas para pedalar e gerar energia
3. Mantenha a energia alta para pontuar mais
4. A energia diminui naturalmente quando não está pedalando
5. PRIMEIRO A 100% DE ENERGIA VENCE!

⚡ FÍSICA:
- Energia aumenta progressivamente com cada pedalada
- Decaimento natural configurável (0.1% a 15% por segundo)
- Pontuação baseada na energia constante
- Efeitos visuais e animações

⚙️ CONFIGURAÇÕES:
- Clique em "⚙️ Configurações" para ajustar a física
- Personalize taxa de geração (1% a 10% por pedalada)
- Ajuste taxa de decaimento para diferentes níveis de dificuldade
- Configurações são salvas automaticamente no navegador
- Persistem entre sessões e recarregamentos

📊 RELATÓRIOS:
- Cada partida é registrada com timestamp e estatísticas
- Clique em "📈 Dashboard de Relatórios" para visualização completa
- Dados persistem no navegador e podem ser exportados

🎯 OBJETIVO:
Ser o primeiro a atingir 100% de energia!
`);
