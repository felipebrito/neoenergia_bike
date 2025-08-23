# 🚴 BikeJJ - Competição de Energia com Bicicletas

> **Uma aplicação interativa de competição onde 4 jogadores competem pedalando para gerar energia e vencer!**

## 📖 Índice

- [🎯 O que é o BikeJJ?](#-o-que-é-o-bikejj)
- [🚀 Como Funciona](#-como-funciona)
- [🎮 Como Jogar](#-como-jogar)
- [⚡ Sistema de Física](#-sistema-de-física)
- [⚙️ Configurações](#️-configurações)
- [🛠️ Tecnologias Utilizadas](#️-tecnologias-utilizadas)
- [📁 Estrutura do Projeto](#-estrutura-do-projeto)
- [🚀 Como Executar](#-como-executar)
- [🎨 Características Visuais](#-características-visuais)
- [🔧 Personalizações](#-personalizações)
- [🎯 Roadmap Futuro](#-roadmap-futuro)
- [🤝 Como Contribuir](#-como-contribuir)

---

## 🎯 O que é o BikeJJ?

O **BikeJJ** é um sistema de competição que simula a geração de energia através de pedaladas em bicicletas. É uma ferramenta educacional e de entretenimento que promove competição saudável e consciência sobre energia sustentável.

### 🌟 **Características Principais:**
- **4 jogadores simultâneos** competindo em tempo real
- **Física realista** das barras de energia
- **Interface moderna** e responsiva
- **Efeitos visuais espetaculares** para o vencedor
- **Configurações personalizáveis** em tempo real
- **Persistência de dados** no navegador

---

## 🚀 Como Funciona

### 🔄 **Fluxo do Jogo:**
1. **Início**: 4 jogadores começam com 0% de energia
2. **Competição**: Cada um pedala usando teclas específicas
3. **Física**: Energia sobe com pedaladas, desce naturalmente
4. **Vitória**: Primeiro a 100% de energia vence!
5. **Reinício**: Nova partida inicia automaticamente em 10s

### ⚡ **Mecânicas de Energia:**
- **Geração**: Cada pedalada adiciona energia (configurável)
- **Decaimento**: Energia diminui naturalmente quando não está pedalando
- **Máximo**: 100% de energia (vitória instantânea)
- **Pontuação**: Baseada na energia constante e pedaladas

---

## 🎮 Como Jogar

### ⌨️ **Controles por Jogador:**
| Jogador | Tecla | Cor da Barra |
|---------|--------|---------------|
| **Jogador 1** | **Q** | 🔴 Vermelha |
| **Jogador 2** | **W** | 🟠 Laranja |
| **Jogador 3** | **E** | 🟡 Amarela |
| **Jogador 4** | **R** | 🟢 Verde |

### 🎯 **Objetivo:**
> **Ser o primeiro a atingir 100% de energia!**

### 📋 **Passo a Passo:**
1. **Clique em "Iniciar Jogo"** para começar
2. **Use as teclas Q, W, E, R** para pedalar
3. **Mantenha a energia alta** para pontuar mais
4. **A energia diminui naturalmente** quando não está pedalando
5. **Primeiro a 100% vence** e recebe efeitos especiais!

---

## ⚡ Sistema de Física

### 🔋 **Geração de Energia:**
- **Taxa de ganho**: Configurável (1% a 10% por pedalada)
- **Progressão**: Aumenta gradualmente com cada pedalada
- **Máximo**: 100% de energia (fixo)

### 📉 **Decaimento Natural:**
- **Taxa de decaimento**: Configurável (0.1% a 15% por segundo)
- **Física realista**: Simula perda de velocidade natural
- **Consistência**: Recompensa jogadores constantes

### 🏆 **Sistema de Pontuação:**
- **Pontos base**: 0.5 por pedalada
- **Bônus de energia**: Pontos extras baseados no nível de energia
- **Bônus de consistência**: Pontos extras para manter energia alta

---

## ⚙️ Configurações

### 🔧 **Menu de Configurações:**
Clique no botão **"⚙️ Configurações"** para acessar:

#### **📊 Parâmetros Ajustáveis:**
1. **Taxa de Geração de Energia**
   - **Range**: 1% a 10% por pedalada
   - **Padrão**: 3%
   - **Efeito**: Quanto mais alto, mais fácil gerar energia

2. **Taxa de Decaimento**
   - **Range**: 0.1% a 15% por segundo
   - **Padrão**: 2.5%
   - **Efeito**: Quanto mais alto, mais rápido a energia diminui

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

### **Características Técnicas:**
- **60 FPS**: Loop de jogo otimizado para suavidade
- **Responsivo**: Funciona em desktop, tablet e mobile
- **Modular**: Código organizado em classes JavaScript
- **Performance**: Otimizado para animações suaves

### **Animações CSS:**
- **Transições**: Suaves entre estados
- **Keyframes**: Animações complexas e personalizadas
- **GPU**: Aceleração por hardware para melhor performance

---

## 📁 Estrutura do Projeto

```
BikeJJ/
├── 📄 index.html          # Interface principal do jogo
├── 🎨 styles.css          # Estilos, animações e efeitos visuais
├── ⚙️ script.js           # Lógica do jogo, física e controles
├── 🐍 server.py           # Servidor local para desenvolvimento
├── 📚 README.md           # Esta documentação
└── 🖼️ assets/            # Recursos visuais (se houver)
```

### **📄 index.html:**
- **Estrutura**: Layout das 4 barras de energia
- **Controles**: Botões de jogo e configurações
- **Responsividade**: Adapta-se a diferentes tamanhos de tela

### **🎨 styles.css:**
- **Design**: Interface moderna com gradientes
- **Animações**: Efeitos de vitória tipo cassino
- **Responsivo**: CSS Grid para layout adaptativo

### **⚙️ script.js:**
- **Classe principal**: `BikeJJGame` gerencia todo o jogo
- **Física**: Cálculos de energia e decaimento
- **Eventos**: Controles por teclado e interface
- **Persistência**: Sistema de configurações salvas

---

## 🚀 Como Executar

### **📋 Pré-requisitos:**
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Python 3.x (para servidor local)
- Suporte a CSS Grid e ES6+

### **📊 Dashboard de Relatórios:**
- **Acesso**: http://localhost:8000/reports.html
- **Tema**: Dark mode consistente com o jogo
- **Gráficos**: Chart.js para visualização de dados
- **Animações**: GSAP para transições suaves
- **Funcionalidades**: Filtros, exportação e reset completo

### **🌐 Opção 1: Servidor Python (Recomendado)**
```bash
# No diretório do projeto
python3 server.py

# O navegador abrirá automaticamente em:
# http://localhost:8000
```

### **🌐 Opção 2: Servidor Python Padrão**
```bash
python3 -m http.server 8000
# Acesse: http://localhost:8000
```

### **🌐 Opção 3: Node.js**
```bash
npx serve .
# Acesse a URL mostrada no terminal
```

### **⚠️ Importante:**
- **Use um servidor local** para melhor performance
- **Evite abrir index.html diretamente** (problemas de persistência)
- **Porta 8001** é a padrão configurada

### **🪟 Problemas Específicos do Windows:**
- **Debug disponível**: Acesse `/windows_debug.html` para testes específicos
- **Script de teste**: Execute `python3 windows_test.py` para diagnóstico
- **Script simples**: Execute `python3 windows_simple_test.py` (sem dependências)
- **Console do navegador**: Pressione F12 para ver logs de debug
- **Logs específicos**: Console mostra comparações de vitória para Windows
- **Verificação de tipos**: Debug automático de tipos de dados



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
- **Animações**: Ajuste durações e efeitos
- **Layout**: Adapte para diferentes números de jogadores

---

## 🎯 Roadmap Futuro

### **🔄 Fase 2: ESP32 + Sensores (Próxima)**
- **Hardware**: 4 sensores indutores + ESP32
- **Firmware**: Código para leitura dos sensores
- **Comunicação**: API para envio de dados
- **Integração**: Conectar com a interface web

### **📱 Fase 3: Melhorias e Recursos**
- **Sons**: Efeitos sonoros para pedaladas e vitória
- **Modos de jogo**: Diferentes tipos de competição
- **Histórico**: Salvar resultados das partidas
- **Multiplayer**: Competição online entre jogadores

### **🎮 Recursos Planejados:**
- **Níveis de dificuldade**: Fácil, médio, difícil
- **Modos especiais**: Tempo, distância, energia
- **Estatísticas**: Gráficos de performance
- **Conquistas**: Sistema de badges e recompensas

---

## 🤝 Como Contribuir

### **💡 Áreas para Contribuição:**
- **Interface**: Melhorias no design e UX
- **Física**: Otimizações no sistema de energia
- **Animações**: Novos efeitos visuais
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

---

## 🎉 **Divirta-se pedalando e competindo no BikeJJ!** ⚡

> **Lembre-se: A energia sustentável começa com uma pedalada!** 🚴💚

---

*Última atualização: Agosto 2025*
*Versão: 1.0.0*
