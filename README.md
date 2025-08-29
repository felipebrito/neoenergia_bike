# 🚴 BikeJJ - Competição de Energia com Bicicletas

> **Uma aplicação interativa de competição onde 4 jogadores competem pedalando para gerar energia e vencer! Com suporte completo para Arduino Mega e sensores reais!**

## 📖 Índice

- [🎯 O que é o BikeJJ?](#-o-que-é-o-bikejj)
- [🚀 Como Funciona](#-como-funciona)
- [🎮 Como Jogar](#-como-jogar)
- [⚡ Sistema de Física](#-sistema-de-física)
- [🔌 Integração Arduino Mega](#-integração-arduino-mega)
- [⚙️ Configurações](#️-configurações)
- [🛠️ Tecnologias Utilizadas](#️-tecnologias-utilizadas)
- [📁 Estrutura do Projeto](#-estrutura-do-projeto)
- [🚀 Como Executar](#-como-executar)
- [🎨 Características Visuais](#-características-visuais)
- [🔧 Personalizações](#-personalizações)
- [📊 Sistema de Relatórios](#-sistema-de-relatórios)
- [🎯 Roadmap Futuro](#-roadmap-futuro)
- [🤝 Como Contribuir](#-como-contribuir)

---

## 🎯 O que é o BikeJJ?

O **BikeJJ** é um sistema de competição que simula a geração de energia através de pedaladas em bicicletas. É uma ferramenta educacional e de entretenimento que promove competição saudável e consciência sobre energia sustentável.

### 🌟 **Características Principais:**
- **4 jogadores simultâneos** competindo em tempo real
- **Física realista** das barras de energia com decaimento natural
- **Interface moderna** e responsiva com animações GSAP suaves
- **Integração Arduino Mega** para sensores reais de bicicleta
- **Sistema de reset robusto** sem loops infinitos
- **Configurações personalizáveis** em tempo real
- **Persistência de dados** no navegador
- **Auto-reinício** após vitória com contador regressivo
- **Animações orgânicas** com easing suave e efeitos visuais
- **Modo offline completo** com modal de controle quando servidor indisponível

---

## 🚀 Como Funciona

### 🔄 **Fluxo do Jogo:**
1. **Início**: 4 jogadores começam com 0% de energia
2. **Competição**: Cada um pedala usando teclas específicas ou sensor Arduino Mega
3. **Física**: Energia sobe com pedaladas, desce naturalmente quando não pedala
4. **Vitória**: Primeiro a 100% de energia vence!
5. **Congelamento**: Todos os jogadores são congelados visualmente
6. **Reinício**: Nova partida inicia automaticamente em 8 segundos

### ⚡ **Mecânicas de Energia:**
- **Geração**: Cada pedalada adiciona energia (configurável)
- **Decaimento**: Energia diminui naturalmente quando não está pedalando
- **Máximo**: 100% de energia (vitória instantânea)
- **Pontuação**: Baseada na energia constante e pedaladas
- **Física realista**: Simula perda de velocidade natural

---

## 🎮 Como Jogar

### ⌨️ **Controles por Jogador:**
| Jogador | Tecla | Cor da Barra | Sensor Arduino |
|---------|--------|---------------|----------------|
| **Jogador 1** | **Q** | 🔴 Vermelha | ✅ **SIM** |
| **Jogador 2** | **W** | 🟠 Laranja | ✅ **SIM** |
| **Jogador 3** | **E** | 🟡 Amarela | ✅ **SIM** |
| **Jogador 4** | **R** | 🟢 Verde | ✅ **SIM** |

### 🎯 **Objetivo:**
> **Ser o primeiro a atingir 100% de energia!**

### 📋 **Passo a Passo:**
1. **Clique em "Iniciar Jogo"** para começar
2. **Use as teclas Q, W, E, R** para pedalar (ou sensores Arduino para todos)
3. **Mantenha a energia alta** para pontuar mais
4. **A energia diminui naturalmente** quando não está pedalando
5. **Primeiro a 100% vence** e recebe efeitos especiais!
6. **Jogo reinicia automaticamente** após 8 segundos

---

## ⚡ Sistema de Física

### 🔋 **Geração de Energia:**
- **Taxa de ganho**: Configurável (1% a 10% por pedalada)
- **Progressão**: Aumenta gradualmente com cada pedalada
- **Máximo**: 100% de energia (fixo)
- **Arduino Mega**: Todos os jogadores podem usar sensores reais

### 📉 **Decaimento Natural:**
- **Taxa de decaimento**: Configurável (0.1% a 15% por segundo)
- **Física realista**: Simula perda de velocidade natural
- **Consistência**: Recompensa jogadores constantes
- **Baseado em tempo**: Decaimento ocorre a cada 0.1 segundos de inatividade
- **Timeout inteligente**: 1.5 segundos de inatividade para reset automático

### 🏆 **Sistema de Pontuação:**
- **Pontos base**: 0.5 por pedalada
- **Bônus de energia**: Pontos extras baseados no nível de energia
- **Bônus de consistência**: Pontos extras para manter energia alta

---

## 🔌 Integração Arduino Mega

### 🚴 **Hardware Suportado:**
- **Arduino Mega**: Microcontrolador principal
- **Sensores Indutivos**: Detecta pedaladas reais para todos os jogadores
- **Conexão**: USB Serial (COM/Serial)
- **Porta**: Detecção automática no servidor

### 📡 **Comunicação:**
- **Protocolo**: Serial USB
- **Formato**: Mensagens de texto UTF-8
- **Frequência**: Polling HTTP adaptativo (60-120 FPS)
- **Latência**: <50ms para resposta
- **Buffering**: Sistema de buffer para múltiplas pedaladas consecutivas

### 🔧 **Firmware Arduino:**
```arduino
// Mensagens enviadas:
🔍 Jogador X: Pedalada #Y detectada
Pedalada: True
Pedalada: False (após inatividade)
Pedaladas: Y (contador total)
```

### ⚙️ **Configuração do Servidor:**
```python
# Em robust_server.py - detecção automática de porta
# O servidor detecta automaticamente a porta do Arduino
# Não é necessário configurar manualmente
```

### 🎮 **Funcionalidades Arduino:**
- **Auto-início**: Jogo inicia automaticamente com primeira pedalada
- **Decaimento inteligente**: Baseado em tempo real de inatividade
- **Debounce**: Evita múltiplas leituras da mesma pedalada
- **Status em tempo real**: Atualização contínua da barra de energia
- **Sistema de prontidão**: Cada jogador deve dar uma pedalada para "estar pronto"

---

## ⚙️ Configurações

### 🔧 **Menu de Configurações:**
Clique no botão **"⚙️ Configurações"** para acessar:

#### **📊 Parâmetros Ajustáveis:**
1. **Taxa de Geração de Energia**
   - **Range**: 1% a 10% por pedalada
   - **Padrão**: 5%
   - **Efeito**: Quanto mais alto, mais fácil gerar energia

2. **Taxa de Decaimento**
   - **Range**: 0.1% a 15% por segundo
   - **Padrão**: 2.5%
   - **Efeito**: Quanto mais alto, mais rápido a energia diminui

3. **Taxa de Strobe LED**
   - **Range**: 100ms a 500ms
   - **Padrão**: 200ms
   - **Efeito**: Velocidade do efeito de vitória

#### **💾 Persistência:**
- **Salvamento automático**: Configurações são salvas no navegador
- **Restauração**: Persistem entre sessões e recarregamentos
- **Padrão**: Botão "🔄 Padrão" restaura configurações originais

---

## 🛠️ Tecnologias Utilizadas

### **Frontend:**
- **HTML5**: Estrutura semântica e moderna
- **CSS3**: Estilos avançados com gradientes e animações
- **JavaScript ES6+**: Lógica do jogo e física em tempo real
- **GSAP**: Biblioteca profissional para animações suaves e orgânicas

### **Backend:**
- **Python 3.x**: Servidor HTTP robusto com comunicação serial
- **PySerial**: Biblioteca para comunicação com Arduino Mega
- **HTTP Polling**: Comunicação em tempo real com frontend
- **Multithreading**: Threads separados para serial e decaimento

### **Hardware:**
- **Arduino Mega**: Microcontrolador para sensores
- **Arduino IDE**: Desenvolvimento do firmware
- **Sensores Indutivos**: Detecção de pedaladas para todos os jogadores

### **Características Técnicas:**
- **60-120 FPS**: Polling adaptativo baseado na atividade
- **Responsivo**: Funciona em desktop, tablet e mobile
- **Modular**: Código organizado em classes JavaScript
- **Performance**: Otimizado para animações suaves
- **Tempo real**: Atualização adaptativa baseada na atividade

### **Animações GSAP:**
- **Easing suave**: `power2.out` para ganhos, `power1.out` para perdas
- **Duração otimizada**: 1.5s para ganhos, 2.0s para perdas
- **Efeitos visuais**: Partículas, ripple, pulse suave
- **Performance**: Aceleração por hardware para melhor fluidez

---

## 📁 Estrutura do Projeto

```
BikeJJ/
├── 📄 index.html              # Interface principal do jogo
├── 🎨 styles.css              # Estilos, animações e efeitos visuais
├── ⚙️ script.js               # Lógica do jogo, física e controles
├── 🐍 robust_server.py        # Servidor Python robusto com Arduino
├── 🔧 esp32_bike_sensor/      # Firmware Arduino para sensores
│   └── esp32_bike_sensor.ino  # Código principal dos sensores
├── 📊 reports.html            # Dashboard de relatórios
├── 📊 reports.js              # Lógica dos relatórios
├── 📊 reports.css             # Estilos dos relatórios
├── 📚 README.md               # Esta documentação
└── 🖼️ assets/                # Recursos visuais (se houver)
```

### **📄 index.html:**
- **Estrutura**: Layout das 4 barras de energia
- **Controles**: Botões de jogo e configurações
- **Responsividade**: Adapta-se a diferentes tamanhos de tela
- **GSAP**: Biblioteca integrada para animações suaves

### **🎨 styles.css:**
- **Design**: Interface moderna com gradientes
- **Animações**: Efeitos de vitória tipo cassino
- **Responsivo**: CSS Grid para layout adaptativo
- **Congelamento**: Efeitos visuais para jogadores congelados
- **Partículas**: Estilos para sistema de partículas GSAP

### **⚙️ script.js:**
- **Classe principal**: `BikeJJGame` gerencia todo o jogo
- **Física**: Cálculos de energia e decaimento
- **Eventos**: Controles por teclado e interface
- **Persistência**: Sistema de configurações salvas
- **Reset robusto**: Sistema estável de reinicialização sem loops
- **Congelamento**: Sistema de pausa visual para vencedores
- **Animações GSAP**: Sistema completo de animações suaves

### **🐍 robust_server.py:**
- **Servidor HTTP**: Serve arquivos estáticos e API
- **Comunicação Serial**: Integração com Arduino Mega
- **API REST**: Endpoints para estado do jogo
- **Processamento**: Lógica de pedaladas e decaimento
- **Multithreading**: Threads separados para melhor performance
- **Auto-detecção**: Porta serial detectada automaticamente

### **🔧 esp32_bike_sensor.ino:**
- **Firmware**: Código para sensores de bicicleta
- **Sensor**: Leitura de sensor indutivo
- **Debounce**: Prevenção de múltiplas leituras
- **Serial**: Comunicação com servidor Python

---

## 🚀 Como Executar

### **📋 Pré-requisitos:**
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Python 3.x (para servidor local)
- Suporte a CSS Grid e ES6+
- Arduino Mega (opcional, para sensores reais)

### **🔌 Com Arduino Mega (Recomendado):**
```bash
# 1. Conectar Arduino Mega via USB
# 2. O servidor detecta automaticamente a porta
# 3. Executar servidor robusto
python3 robust_server.py

# 4. Acessar no navegador:
# http://localhost:9000
```

### **🌐 Sem Arduino (Teclado apenas):**
```bash
# Executar servidor
python3 robust_server.py

# Acessar no navegador:
# http://localhost:9000
```

### **📊 Dashboard de Relatórios:**
- **Acesso**: http://localhost:9000/reports.html
- **Tema**: Dark mode consistente com o jogo
- **Gráficos**: Chart.js para visualização de dados
- **Animações**: GSAP para transições suaves
- **Funcionalidades**: Filtros, exportação e reset completo

### **⚠️ Importante:**
- **Use o servidor robusto** para melhor performance e estabilidade
- **Evite abrir index.html diretamente** (problemas de persistência)
- **Porta 9000** é a padrão configurada
- **Arduino Mega deve estar conectado** para funcionalidade completa

---

## 🎨 Características Visuais

### **🎨 Design da Interface:**
- **Tema Dark**: Fundo preto com gradientes sutis
- **Barras**: 7 segmentos coloridos (vermelho ao azul)
- **Sombras**: Efeitos de profundidade e modernidade
- **Tipografia**: Fontes legíveis e hierarquia clara
- **Efeitos de Scan**: Linhas horizontais e verticais animadas

### **🏆 Efeitos de Vitória (Tipo Cassino):**
- **Glow Colorido**: Borda que alterna entre cores
- **Laser Scanner**: Gradiente rotativo ao redor da barra
- **Listras Animadas**: Pontilhados em movimento
- **Spotlight**: Luz rotativa dentro da barra
- **Strobe de Cores**: Mudança rápida de cores
- **Partículas**: 60 partículas coloridas explosivas
- **Chuva de Estrelas**: 40 estrelas caindo

### **🖤 Efeitos para Perdedores:**
- **Filtro**: Grayscale 100% + brightness baixo
- **Cores**: Barras ficam pretas e sombrias
- **Contraste**: Destaque visual para o vencedor

### **❄️ Efeitos de Congelamento:**
- **Visual**: Barras ficam azuis e opacas
- **Interação**: Controles desabilitados
- **Transição**: Efeito suave de congelamento

### **✨ Animações GSAP Suaves:**
- **Movimento orgânico**: Easing natural para todas as animações
- **Partículas de energia**: Sistema de partículas flutuantes
- **Efeito ripple**: Ondulações durante ganho de energia
- **Pulse suave**: Escala sutil para ganhos grandes
- **Estabilização**: Transição suave para estado final

### **🔌 Modo Offline Inteligente:**
- **Detecção automática**: Identifica quando servidor está indisponível
- **Modal de controle**: Interface completa para gerenciar modo offline
- **Jogo funcional**: Todas as funcionalidades disponíveis offline
- **Auto-reconexão**: Tenta reconectar automaticamente ao servidor
- **Status visual**: Indicadores de conexão na interface principal
- **Configurações offline**: Acesso completo às configurações do jogo

---

## 🔧 Personalizações

### **🎛️ Configurações Recomendadas:**

#### **🚀 Para Partidas Rápidas:**
- **Decaimento**: 8-15% por segundo
- **Geração**: 1-3% por pedalada
- **Resultado**: Jogos mais intensos e rápidos

#### **⚖️ Para Partidas Equilibradas:**
- **Decaimento**: 3-7% por segundo
- **Geração**: 3-6% por pedalada
- **Resultado**: Competição balanceada

#### **🐌 Para Partidas Longas:**
- **Decaimento**: 0.1-2% por segundo
- **Geração**: 7-10% por pedalada
- **Resultado**: Jogos mais estratégicos

### **🎨 Personalização Visual:**
- **Cores**: Modifique as variáveis CSS
- **Animações**: Ajuste durações e efeitos GSAP
- **Layout**: Adapte para diferentes números de jogadores

---

## 📊 Sistema de Relatórios

### **📈 Dashboard Completo:**
- **Estatísticas**: Performance de cada jogador
- **Gráficos**: Evolução da energia ao longo do tempo
- **Histórico**: Todas as partidas jogadas
- **Exportação**: Dados em formato CSV/JSON

### **🎯 Métricas Disponíveis:**
- **Energia máxima**: Maior nível atingido por jogador
- **Tempo de jogo**: Duração de cada partida
- **Pedaladas**: Total de pedaladas por jogador
- **Eficiência**: Relação entre energia e pedaladas

---

## 🎯 Roadmap Futuro

### **🔄 Fase 2: Melhorias Arduino (Em desenvolvimento)**
- **Múltiplos sensores**: 4 sensores para todos os jogadores
- **Calibração**: Sistema de calibração automática
- **WiFi**: Comunicação sem fio (opcional)
- **Bateria**: Sistema de alimentação independente

### **📱 Fase 3: Recursos Avançados**
- **Sons**: Efeitos sonoros para pedaladas e vitória
- **Modos de jogo**: Diferentes tipos de competição
- **Histórico**: Salvar resultados das partidas
- **Multiplayer**: Competição online entre jogadores

### **🎮 Recursos Planejados:**
- **Níveis de dificuldade**: Fácil, médio, difícil
- **Modos especiais**: Tempo, distância, energia
- **Estatísticas**: Gráficos de performance avançados
- **Conquistas**: Sistema de badges e recompensas
- **API**: Interface para integração com outros sistemas

---

## 🤝 Como Contribuir

### **💡 Áreas para Contribuição:**
- **Interface**: Melhorias no design e UX
- **Física**: Otimizações no sistema de energia
- **Animações**: Novos efeitos visuais GSAP
- **Arduino**: Melhorias no firmware
- **Documentação**: Traduções e melhorias

### **🔧 Como Contribuir:**
1. **Fork** o repositório
2. **Crie uma branch** para sua feature
3. **Faça as alterações** e teste
4. **Commit** com mensagem descritiva
5. **Push** para sua branch
6. **Abra um Pull Request**

### **📝 Padrões de Código:**
- **JavaScript**: ES6+ com classes
- **CSS**: BEM methodology para classes
- **HTML**: Semântico e acessível
- **Python**: PEP 8 para código Python
- **Arduino**: Padrões da comunidade Arduino
- **Comentários**: Código bem documentado

---

## 📞 Suporte e Contato

### **🐛 Reportar Bugs:**
- Abra uma **Issue** no GitHub
- Descreva o problema detalhadamente
- Inclua passos para reproduzir
- Adicione screenshots se relevante

### **💬 Sugestões:**
- Use **Discussions** para ideias
- Compartilhe experiências de uso
- Proponha novas funcionalidades

### **📧 Contato:**
- **GitHub**: [@felipebrito](https://github.com/felipebrito)
- **Repositório**: [neoenergia_bike](https://github.com/felipebrito/neoenergia_bike.git)

---

## 📄 Licença

Este projeto é de código aberto e está disponível sob a licença **MIT**.

---

## 🙏 Agradecimentos

- **Comunidade open source** por inspiração
- **Contribuidores** que ajudaram no desenvolvimento
- **Usuários** que testaram e deram feedback
- **Comunidade Arduino** por suporte técnico
- **GSAP** por animações profissionais e suaves

---

## 🎉 **Divirta-se pedalando e competindo no BikeJJ!** ⚡

> **Lembre-se: A energia sustentável começa com uma pedalada!** 🚴💚

---

*Última atualização: Agosto 2025*
*Versão: 3.0.0 - Arduino Mega + GSAP + Reset Robusto*
