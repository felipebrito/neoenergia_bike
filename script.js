class BikeJJGame {
    constructor() {
        this.gameState = 'waiting'; // waiting, playing, finished
        this.gameTime = 0;
        this.gameTimer = null;
        
        // Configurações padrão
        this.defaultConfig = {
            energyDecayRate: 2.5,
            energyGainRate: 3
        };
        
        // Carregar configurações salvas ou usar padrões
        this.loadConfig();
        
        this.maxEnergy = 100; // Fixo em 100%
        
        this.players = [
            { id: 1, key: 'KeyQ', energy: 0, score: 0, isPedaling: false, lastPedalTime: 0 },
            { id: 2, key: 'KeyW', energy: 0, score: 0, isPedaling: false, lastPedalTime: 0 },
            { id: 3, key: 'KeyE', energy: 0, score: 0, isPedaling: false, lastPedalTime: 0 },
            { id: 4, key: 'KeyR', energy: 0, score: 0, isPedaling: false, lastPedalTime: 0 }
        ];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupGameLoop();
        this.updateDisplay();
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
        
        // Reset das barras de energia
        this.players.forEach(player => {
            player.energy = 0;
            player.score = 0;
            player.isPedaling = false;
        });
        
        document.getElementById('startBtn').disabled = true;
        document.getElementById('startBtn').textContent = 'Jogo em Andamento';
        
        this.updateDisplay();
        this.showMessage('Jogo iniciado! Use Q, W, E, R para pedalar! Primeiro a 100% vence!');
    }
    
    handleKeyDown(e) {
        if (this.gameState !== 'playing') return;
        
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
        if (!player) return;
        
        const now = Date.now();
        
        // Evitar spam de inputs (mínimo 50ms entre inputs)
        if (now - player.lastPedalTime < 50) return;
        
        player.lastPedalTime = now;
        player.isPedaling = true;
        
        // Aumentar energia
        player.energy = Math.min(this.maxEnergy, player.energy + this.energyGainRate);
        
        // Adicionar pontuação baseada na energia atual
        const energyBonus = Math.floor(player.energy / 20); // Reduzido o bônus
        player.score += 0.5 + energyBonus; // Reduzido o ganho base
        
        // Removido efeito visual de pedalada
        
        this.updateDisplay();
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
            // Decaimento natural da energia
            if (!player.isPedaling) {
                player.energy = Math.max(0, player.energy - (this.energyDecayRate / 60));
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
        
        // Mostrar botão de nova partida
        document.getElementById('newGameButton').style.display = 'block';
        
        // Efeitos visuais especiais - mais intensos
        this.createCasinoParticles(winner.id);
        
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
    }
    
    updateConfigDisplay() {
        // Atualizar valores dos sliders com configurações atuais
        document.getElementById('energyGainRate').value = this.energyGainRate;
        document.getElementById('energyGainValue').textContent = this.energyGainRate + '%';
        
        document.getElementById('energyDecayRate').value = this.energyDecayRate;
        document.getElementById('energyDecayValue').textContent = this.energyDecayRate + '%';
    }
    
    applyConfig() {
        // Aplicar novas configurações
        this.energyGainRate = parseFloat(document.getElementById('energyGainRate').value);
        this.energyDecayRate = parseFloat(document.getElementById('energyDecayRate').value);
        
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

🎯 OBJETIVO:
Ser o primeiro a atingir 100% de energia!
`);
