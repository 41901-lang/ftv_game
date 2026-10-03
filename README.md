# 🏐 FUTEVÔLEI ARENA — O Jogo Oficial da Areia

Um jogo completo de **FUTEVÔLEI ARCADE PRO** desenvolvido **exclusivamente com HTML5, CSS3 e JavaScript puro (Vanilla JS)**, sem qualquer framework, biblioteca ou dependência externa.

Basta abrir o arquivo [index.html](file:///c:/Users/Desktop/Documents/marcos/index.html) diretamente em qualquer navegador moderno (Chrome, Edge, Firefox, Safari) para jogar!

---

## 🌟 Destaques do Projeto

* **Zero Dependências:** Construído 100% com Canvas 2D, CSS3 e Vanilla JavaScript.
* **Áudio Procedural com Web Audio API:** Todos os efeitos sonoros (apito vibrante de juiz, chutes de impacto, cabeceios ocos, quiques na areia, rede, comemoração da torcida, som de ondas do mar e fanfarras) são gerados em tempo real via síntese sonora sem depender de arquivos de áudio externos.
* **Física Realista de Futevôlei:** Gravidade, colisão de rede elástica com fita superior, rebotes na areia, efeito aerodinâmico Magnus de curva e regra dos 3 toques por lado.
* **4 Níveis de Inteligência Artificial:** Fácil, Normal, Difícil e Lenda (com posicionamento, predição parabólica de trajetória, cortes rasantes e erros humanos dosados).
* **6 Atletas Únicos:** Rafa, Leo, Kai, Bruno, Miguel e Davi (cada um com atributos próprios de Velocidade, Força, Defesa, Controle e Ataque Especial).
* **3 Arenas Visuais:** Praia Tropical (dia com mar animado e sol), Arena Sunset (pôr do sol dourado e tochas) e Arena Noturna (refletores profissionais).
* **Sistema de Save Local:** Progresso de moedas (Areia Coins), XP, níveis, itens desbloqueados e chave de campeonato salvos automaticamente no `localStorage`.
* **Controles Responsivos:** Teclado no Desktop + Controles Virtuais Touch na tela para smartphones e tablets.

---

## 🎮 Controles do Jogo

### Desktop (Teclado)
* <kbd>W</kbd> ou <kbd>ESPAÇO</kbd> ou <kbd>▲</kbd>: **Pular / Impulsão aérea**
* <kbd>A</kbd> / <kbd>D</kbd> ou <kbd>◀</kbd> / <kbd>▶</kbd>: **Mover para esquerda / direita**
* <kbd>S</kbd> ou <kbd>▼</kbd>: **Amortecer no peito / Levantar bola**
* <kbd>J</kbd>: **Chute padrão / Shark Attack & Smash no ar**
* <kbd>K</kbd>: **Cabeceio direcionado / Defesa aérea**
* <kbd>L</kbd>: **Ataque Especial** *(disponível quando a barra de energia atinge 100%)*
* <kbd>E</kbd>: **Sacar a bola** *(quando o saque for seu)*
* <kbd>ESC</kbd>: **Pausar o jogo**

### Dispositivos Móveis (Touch)
* **D-Pad virtual** no canto inferior esquerdo para movimentação e pulo.
* **Botões de ação tátil** (CHUTE, CABEÇA, PULO, ESPECIAL) no canto inferior direito.

---

## 🏆 Modos de Jogo

1. **⚡ Partida Rápida:** Configure seu atleta, o rival da IA, o nível de dificuldade (Fácil a Lenda), o cenário da praia e a meta de pontos (6, 12 ou 18 pontos).
2. **🏆 Campeonato Mata-Mata:** Disputa eliminatória clássica (Quartas de Final ➔ Semifinal ➔ Grande Final). Supere Bruno, Kai e o lendário Davi para erguer o Troféu de Ouro e embolsar 2.000 Areia Coins!
3. **🎯 Centro de Treinamento Pro:**
   * **Treino de Saque:** Acerte a área delimitada na quadra adversária para bônus de precisão.
   * **Ataque & Shark Attack:** Bola alta na rede para treinar o tempo da cortada.
   * **Defesa & Peito:** Canhão adversário dispara bolas rápidas para treinar amortecidas.
   * **Cabeceio Preciso:** Bolas aéreas em arco para treinar ângulos de finalização.
   * **Controle & Embaixadinha:** Mantenha a bola no ar com contagem contínua de toques.
   * **Treino Livre:** Prática sem limite de tempo ou pontuação.
4. **👕 Vestiário & Personalização:** Compre e equipe regatas, shorts, bolas de futevôlei (Mikasa, Sunset, Neon e Ouro), óculos de sol, bonés e rastros de impacto com suas **Areia Coins**.
5. **📜 Desafios & Conquistas:** 8 troféus desbloqueáveis com recompensas generosas de moedas.
6. **⚙️ Configurações:** Ajuste volumes SFX, som ambiente, qualidade de partículas e tela cheia.

---

## 📁 Estrutura dos Arquivos

* [index.html](file:///c:/Users/Desktop/Documents/marcos/index.html) — Estrutura semântica completa com HUD, modais e controles.
* [style.css](file:///c:/Users/Desktop/Documents/marcos/style.css) — Folha de estilos moderna com design esportivo, glassmorphism e responsividade.
* [script.js](file:///c:/Users/Desktop/Documents/marcos/script.js) — Motor completo do jogo (AudioSystem, Ball Physics, Player/AI controller, CourtRenderer, MatchManager, SaveSystem, ParticleSystem).
