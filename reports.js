// BikeJJ Reports Dashboard
class BikeJJReports {
    constructor() {
        this.gameReports = [];
        this.charts = {};
        this.currentMetric = 'energy';
        this.filters = {
            date: 'all',
            player: 'all'
        };
        
        this.init();
    }
    
    init() {
        this.loadGameReports();
        this.setupEventListeners();
        this.setupGSAP();
        this.renderDashboard();
        this.hideLoading();
    }
    
    // Carregar relatórios salvos
    loadGameReports() {
        try {
            const savedReports = localStorage.getItem('bikejj_game_reports');
            if (savedReports) {
                this.gameReports = JSON.parse(savedReports);
                console.log('📊 Relatórios carregados:', this.gameReports.length);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar relatórios:', error);
            this.gameReports = [];
        }
    }
    
    // Configurar event listeners
    setupEventListeners() {
        // Filtros
        document.getElementById('dateFilter').addEventListener('change', (e) => {
            this.filters.date = e.target.value;
            this.applyFilters();
        });
        
        document.getElementById('playerFilter').addEventListener('change', (e) => {
            this.filters.player = e.target.value;
            this.applyFilters();
        });
        
        // Botão de exportar
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportData();
        });
        
        // Controles de gráfico
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchChartMetric(e.target.dataset.metric);
            });
        });
    }
    
    // Configurar animações GSAP
    setupGSAP() {
        gsap.registerPlugin(ScrollTrigger);
        
        // Animações de entrada dos elementos
        gsap.utils.toArray('[data-animation]').forEach(element => {
            const animation = element.dataset.animation;
            const delay = parseFloat(element.dataset.delay) || 0;
            
            ScrollTrigger.create({
                trigger: element,
                start: 'top 80%',
                onEnter: () => {
                    gsap.to(element, {
                        duration: 0.8,
                        opacity: 1,
                        y: 0,
                        x: 0,
                        ease: 'power3.out',
                        delay: delay
                    });
                }
            });
        });
        
        // Animações dos cards de resumo
        gsap.utils.toArray('.summary-card').forEach((card, index) => {
            gsap.fromTo(card, {
                scale: 0.8,
                opacity: 0
            }, {
                scale: 1,
                opacity: 1,
                duration: 0.6,
                delay: index * 0.1,
                ease: 'back.out(1.7)'
            });
        });
    }
    
    // Renderizar dashboard principal
    renderDashboard() {
        this.updateSummaryCards();
        this.createCharts();
        this.updatePlayerStats();
        this.updateGamesHistory();
    }
    
    // Atualizar cards de resumo
    updateSummaryCards() {
        if (this.gameReports.length === 0) {
            document.getElementById('totalGames').textContent = '0';
            document.getElementById('totalTime').textContent = '0h 0m';
            document.getElementById('totalPedals').textContent = '0';
            document.getElementById('topPlayer').textContent = '-';
            return;
        }
        
        // Total de partidas
        document.getElementById('totalGames').textContent = this.gameReports.length;
        
        // Tempo total
        const totalTime = this.gameReports.reduce((sum, report) => sum + report.duration, 0);
        const hours = Math.floor(totalTime / (1000 * 60 * 60));
        const minutes = Math.floor((totalTime % (1000 * 60 * 60)) / (1000 * 60));
        document.getElementById('totalTime').textContent = `${hours}h ${minutes}m`;
        
        // Total de pedaladas
        const totalPedals = this.gameReports.reduce((sum, report) => sum + report.statistics.totalPedals, 0);
        document.getElementById('totalPedals').textContent = totalPedals.toLocaleString();
        
        // Jogador mais vitorioso
        const playerWins = {};
        this.gameReports.forEach(report => {
            const winnerId = report.winner.id;
            playerWins[winnerId] = (playerWins[winnerId] || 0) + 1;
        });
        
        const topPlayer = Object.entries(playerWins).reduce((a, b) => a[1] > b[1] ? a : b);
        document.getElementById('topPlayer').textContent = `Jogador ${topPlayer[0]} (${topPlayer[1]} vitórias)`;
        
        // Animar valores
        this.animateNumbers();
    }
    
    // Animar números nos cards
    animateNumbers() {
        gsap.utils.toArray('.card-value').forEach(element => {
            const finalValue = element.textContent;
            const numericValue = parseFloat(finalValue.replace(/[^\d.]/g, ''));
            
            if (!isNaN(numericValue)) {
                gsap.fromTo(element, {
                    textContent: 0
                }, {
                    textContent: numericValue,
                    duration: 1.5,
                    ease: 'power2.out',
                    snap: { textContent: 1 }
                });
            }
        });
    }
    
    // Criar gráficos
    createCharts() {
        // Verificar se Chart.js está disponível
        if (typeof Chart === 'undefined') {
            console.error('❌ Chart.js não está carregado');
            return;
        }
        
        this.createWinsChart();
        this.createPerformanceChart();
    }
    
    // Gráfico de vitórias por jogador
    createWinsChart() {
        const canvas = document.getElementById('winsChart');
        if (!canvas) {
            console.error('❌ Canvas do gráfico de vitórias não encontrado');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        
        const playerWins = {};
        this.gameReports.forEach(report => {
            const winnerId = report.winner.id;
            playerWins[winnerId] = (playerWins[winnerId] || 0) + 1;
        });
        
        const data = {
            labels: ['Jogador 1', 'Jogador 2', 'Jogador 3', 'Jogador 4'],
            datasets: [{
                data: [
                    playerWins[1] || 0,
                    playerWins[2] || 0,
                    playerWins[3] || 0,
                    playerWins[4] || 0
                ],
                backgroundColor: [
                    '#FF6B6B',
                    '#4ECDC4',
                    '#45B7D1',
                    '#96CEB4'
                ],
                borderColor: [
                    '#FF5252',
                    '#26A69A',
                    '#1976D2',
                    '#66BB6A'
                ],
                borderWidth: 2,
                hoverOffset: 4
            }]
        };
        
        this.charts.wins = new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
                                return `${context.label}: ${context.parsed} vitórias (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 2000,
                    easing: 'easeOutQuart'
                }
            }
        });
    }
    
    // Gráfico de performance ao longo do tempo
    createPerformanceChart() {
        const canvas = document.getElementById('performanceChart');
        if (!canvas) {
            console.error('❌ Canvas do gráfico de performance não encontrado');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        
        // Preparar dados para o gráfico
        const chartData = this.preparePerformanceData();
        
        this.charts.performance = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'minute',
                            displayFormats: {
                                minute: 'HH:mm'
                            }
                        },
                        title: {
                            display: true,
                            text: 'Tempo'
                        },
                        ticks: {
                            source: 'auto',
                            maxRotation: 45
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: this.currentMetric === 'energy' ? 'Energia (%)' : 'Pontuação'
                        }
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeOutQuart'
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }
    
    // Preparar dados para gráfico de performance
    preparePerformanceData() {
        if (this.gameReports.length === 0) {
            return {
                labels: [],
                datasets: []
            };
        }
        
        const datasets = [];
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];
        
        for (let playerId = 1; playerId <= 4; playerId++) {
            const playerData = [];
            
            this.gameReports.forEach(report => {
                const player = report.players.find(p => p.id === playerId);
                if (player) {
                    const timestamp = new Date(report.startTime).getTime();
                    const value = this.currentMetric === 'energy' ? 
                        player.maxEnergyReached : 
                        player.finalScore;
                    
                    playerData.push({
                        x: timestamp,
                        y: value
                    });
                }
            });
            
            if (playerData.length > 0) {
                datasets.push({
                    label: `Jogador ${playerId}`,
                    data: playerData,
                    borderColor: colors[playerId - 1],
                    backgroundColor: colors[playerId - 1] + '20',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 6,
                    pointHoverRadius: 8
                });
            }
        }
        
        return { datasets };
    }
    
    // Trocar métrica do gráfico de performance
    switchChartMetric(metric) {
        this.currentMetric = metric;
        
        // Atualizar botões
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.metric === metric);
        });
        
        // Atualizar gráfico
        if (this.charts.performance) {
            const newData = this.preparePerformanceData();
            this.charts.performance.data = newData;
            this.charts.performance.options.scales.y.title.text = 
                metric === 'energy' ? 'Energia (%)' : 'Pontuação';
            this.charts.performance.update('none');
        }
    }
    
    // Atualizar estatísticas por jogador
    updatePlayerStats() {
        const container = document.getElementById('playerStats');
        
        if (this.gameReports.length === 0) {
            container.innerHTML = '<p class="no-data">Nenhuma partida registrada ainda</p>';
            return;
        }
        
        const playerStats = this.calculatePlayerStats();
        let html = '';
        
        Object.entries(playerStats).forEach(([playerId, stats]) => {
            html += `
                <div class="player-stat-item">
                    <div class="player-info">
                        <div class="player-avatar player${playerId}">${playerId}</div>
                        <div class="player-details">
                            <h4>Jogador ${playerId}</h4>
                            <p>${stats.games} partidas jogadas</p>
                        </div>
                    </div>
                    <div class="player-metrics">
                        <span class="metric-value">${stats.wins}</span>
                        <span class="metric-label">Vitórias</span>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // Animar entrada dos itens
        gsap.fromTo('.player-stat-item', {
            opacity: 0,
            x: -30
        }, {
            opacity: 1,
            x: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power2.out'
        });
    }
    
    // Calcular estatísticas por jogador
    calculatePlayerStats() {
        const stats = {};
        
        for (let playerId = 1; playerId <= 4; playerId++) {
            stats[playerId] = {
                games: 0,
                wins: 0,
                totalScore: 0,
                totalEnergy: 0,
                totalPedals: 0,
                avgScore: 0,
                avgEnergy: 0,
                avgPedals: 0
            };
        }
        
        this.gameReports.forEach(report => {
            // Contar vitórias
            const winnerId = report.winner.id;
            stats[winnerId].wins++;
            
            // Estatísticas gerais
            report.players.forEach(player => {
                const playerId = player.id;
                stats[playerId].games++;
                stats[playerId].totalScore += player.finalScore;
                stats[playerId].totalEnergy += player.finalEnergy;
                stats[playerId].totalPedals += player.totalPedals;
            });
        });
        
        // Calcular médias
        Object.values(stats).forEach(playerStats => {
            if (playerStats.games > 0) {
                playerStats.avgScore = (playerStats.totalScore / playerStats.games).toFixed(1);
                playerStats.avgEnergy = (playerStats.totalEnergy / playerStats.games).toFixed(1);
                playerStats.avgPedals = (playerStats.totalPedals / playerStats.games).toFixed(1);
            }
        });
        
        return stats;
    }
    
    // Atualizar histórico de partidas
    updateGamesHistory() {
        const container = document.getElementById('gamesHistory');
        
        if (this.gameReports.length === 0) {
            container.innerHTML = '<p class="no-data">Nenhuma partida registrada ainda</p>';
            return;
        }
        
        let html = '';
        
        // Filtrar e ordenar partidas
        const filteredReports = this.getFilteredReports();
        
        filteredReports.forEach(report => {
            const startDate = new Date(report.startTime);
            const duration = Math.round(report.duration / 1000);
            const winner = report.winner;
            
            html += `
                <div class="game-item">
                    <div class="game-info">
                        <div class="game-date">${startDate.toLocaleString('pt-BR')}</div>
                        <div class="game-result">
                            <span class="game-winner">🏆 Jogador ${winner.id} venceu</span>
                        </div>
                        <div class="game-duration">⏱️ ${duration}s</div>
                    </div>
                    <div class="game-stats">
                        <div>📊 ${winner.score} pontos</div>
                        <div>⚡ ${winner.energy.toFixed(1)}% energia</div>
                        <div>🚴 ${report.statistics.totalPedals} pedaladas</div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // Animar entrada dos itens
        gsap.fromTo('.game-item', {
            opacity: 0,
            y: 20
        }, {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.05,
            ease: 'power2.out'
        });
    }
    
    // Aplicar filtros
    applyFilters() {
        this.updateGamesHistory();
        
        // Animar transição
        gsap.to('.games-history', {
            opacity: 0.5,
            duration: 0.2,
            yoyo: true,
            repeat: 1
        });
    }
    
    // Obter relatórios filtrados
    getFilteredReports() {
        let filtered = [...this.gameReports];
        
        // Filtro por data
        if (this.filters.date !== 'all') {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            
            filtered = filtered.filter(report => {
                const reportDate = new Date(report.startTime);
                
                switch (this.filters.date) {
                    case 'today':
                        return reportDate >= today;
                    case 'week':
                        return reportDate >= weekAgo;
                    case 'month':
                        return reportDate >= monthAgo;
                    default:
                        return true;
                }
            });
        }
        
        // Filtro por jogador
        if (this.filters.player !== 'all') {
            const playerId = parseInt(this.filters.player);
            filtered = filtered.filter(report => report.winner.id === playerId);
        }
        
        return filtered;
    }
    
    // Exportar dados
    exportData() {
        const dataStr = JSON.stringify(this.gameReports, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `bikejj_reports_${new Date().toISOString().split('T')[0]}.json`;
        
        // Animar botão
        gsap.to('#exportBtn', {
            scale: 1.1,
            duration: 0.2,
            yoyo: true,
            repeat: 1,
            onComplete: () => {
                link.click();
                this.showNotification('📊 Dados exportados com sucesso!');
            }
        });
    }
    
    // Mostrar notificação
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        gsap.fromTo(notification, {
            opacity: 0,
            y: -50,
            scale: 0.8
        }, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.5,
            ease: 'back.out(1.7)'
        });
        
        setTimeout(() => {
            gsap.to(notification, {
                opacity: 0,
                y: -50,
                scale: 0.8,
                duration: 0.3,
                onComplete: () => {
                    document.body.removeChild(notification);
                }
            });
        }, 3000);
    }
    
    // Esconder loading
    hideLoading() {
        gsap.to('#loadingOverlay', {
            opacity: 0,
            duration: 0.5,
            onComplete: () => {
                document.getElementById('loadingOverlay').style.display = 'none';
            }
        });
    }
}

// Estilos para notificação
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(45deg, #28a745, #20c997);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 8px 25px rgba(40, 167, 69, 0.4);
        z-index: 1001;
        font-weight: 500;
        backdrop-filter: blur(10px);
    }
    
    .no-data {
        text-align: center;
        color: #666;
        font-style: italic;
        padding: 2rem;
    }
`;
document.head.appendChild(notificationStyles);

// Inicializar dashboard quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new BikeJJReports();
});
