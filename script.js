/**
 * ============================================================================
 * FUTEVÔLEI ARENA - JOGO COMPLETO DE FUTEVÔLEI ARCADE
 * Desenvolvido 100% em Vanilla JavaScript, HTML5 Canvas e CSS3
 * Sem dependências ou bibliotecas externas.
 * ============================================================================
 */

(function () {
  'use strict';

  // Polyfill de segurança para CanvasRenderingContext2D.prototype.roundRect
  if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, radii) {
      if (!radii) radii = 0;
      if (typeof radii === 'number') radii = [radii, radii, radii, radii];
      const r = Array.isArray(radii) ? (radii[0] || 0) : 0;
      this.beginPath();
      this.moveTo(x + r, y);
      this.arcTo(x + w, y, x + w, y + h, r);
      this.arcTo(x + w, y + h, x, y + h, r);
      this.arcTo(x, y + h, x, y, r);
      this.arcTo(x, y, x + w, y, r);
      this.closePath();
      return this;
    };
  }

  /* ==========================================================================
     1. SISTEMA DE ÁUDIO PROCEDURAL (Web Audio API)
     Gera todos os efeitos sonoros esportivos e sons de praia via síntese pura.
     ========================================================================== */
  class AudioSystem {
    constructor() {
      this.ctx = null;
      this.muted = false;
      this.sfxVolume = 0.8;
      this.ambientVolume = 0.6;
      this.ambientNode = null;
      this.ambientGain = null;
      this.initialized = false;
    }

    init() {
      if (this.initialized) return;
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        this.initialized = true;
        this.startOceanAmbient();
      } catch (e) {
        console.warn('Web Audio API não suportada ou bloqueada:', e);
      }
    }

    ensureContext() {
      if (!this.initialized) {
        this.init();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    setMuted(muted) {
      this.muted = muted;
      if (this.ambientGain) {
        this.ambientGain.gain.setValueAtTime(muted ? 0 : this.ambientVolume * 0.15, this.ctx?.currentTime || 0);
      }
    }

    setSFXVolume(vol) {
      this.sfxVolume = Math.max(0, Math.min(1, vol));
    }

    setAmbientVolume(vol) {
      this.ambientVolume = Math.max(0, Math.min(1, vol));
      if (this.ambientGain && !this.muted) {
        this.ambientGain.gain.setValueAtTime(this.ambientVolume * 0.15, this.ctx?.currentTime || 0);
      }
    }

    // Gerador de Som Ambiente: Brisa do Mar e Ondas
    startOceanAmbient() {
      if (!this.ctx || this.ambientNode) return;
      try {
        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99 * b0 + white * 0.05;
          b1 = 0.96 * b1 + white * 0.11;
          b2 = 0.86 * b2 + white * 0.25;
          output[i] = (b0 + b1 + b2) * 0.3;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, this.ctx.currentTime);

        // LFO para simular vai-e-vem das ondas
        const lfo = this.ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.18, this.ctx.currentTime); // ~5.5s ciclo
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.setValueAtTime(180, this.ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        this.ambientGain = this.ctx.createGain();
        this.ambientGain.gain.setValueAtTime(this.muted ? 0 : this.ambientVolume * 0.15, this.ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(this.ambientGain);
        this.ambientGain.connect(this.ctx.destination);

        whiteNoise.start();
        lfo.start();
        this.ambientNode = whiteNoise;
      } catch (err) {
        console.warn('Erro ao inicializar som ambiente:', err);
      }
    }

    // Apito Oficial do Árbitro de Futevôlei (Dois tons vibrantes)
    playWhistle(short = false) {
      if (this.muted || !this.ctx) return;
      this.ensureContext();
      const t = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(2600, t);
      osc2.frequency.setValueAtTime(2950, t);

      lfo.frequency.setValueAtTime(28, t);
      lfoGain.gain.setValueAtTime(220, t);
      lfo.connect(lfoGain);
      lfoGain.connect(osc1.frequency);
      lfoGain.connect(osc2.frequency);

      const duration = short ? 0.22 : 0.65;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.28 * this.sfxVolume, t + 0.04);
      gain.gain.setValueAtTime(0.25 * this.sfxVolume, t + duration - 0.08);
      gain.gain.linearRampToValueAtTime(0, t + duration);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(t);
      osc2.start(t);
      lfo.start(t);
      osc1.stop(t + duration);
      osc2.stop(t + duration);
      lfo.stop(t + duration);
    }

    // Som de Chute / Pancada na Bola
    playKick(power = 1.0) {
      if (this.muted || !this.ctx) return;
      this.ensureContext();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      const startFreq = 180 + power * 90;
      osc.frequency.setValueAtTime(startFreq, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.14);

      gain.gain.setValueAtTime(0.55 * this.sfxVolume * Math.min(1.2, power), t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.18);
    }

    // Som de Cabeceio (Som mais oco e agudo)
    playHeader() {
      if (this.muted || !this.ctx) return;
      this.ensureContext();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.12);

      gain.gain.setValueAtTime(0.45 * this.sfxVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.13);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.14);
    }

    // Som do Shark Attack / Bicicleta Fulminante
    playSmash() {
      if (this.muted || !this.ctx) return;
      this.ensureContext();
      this.playKick(1.5);
      const t = this.ctx.currentTime;

      // Adiciona ruído estalado de chicote
      const bufferSize = this.ctx.sampleRate * 0.15;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, t);
      filter.Q.setValueAtTime(3.0, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.5 * this.sfxVolume, t);
      gain.gain.linearRampToValueAtTime(0, t + 0.15);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(t);
    }

    // Toque Suave / Amortecida no Peito
    playCushion() {
      if (this.muted || !this.ctx) return;
      this.ensureContext();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);

      gain.gain.setValueAtTime(0.25 * this.sfxVolume, t);
      gain.gain.linearRampToValueAtTime(0, t + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.11);
    }

    // Quique na Areia
    playSandBounce() {
      if (this.muted || !this.ctx) return;
      this.ensureContext();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(85, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.08);

      gain.gain.setValueAtTime(0.3 * this.sfxVolume, t);
      gain.gain.linearRampToValueAtTime(0, t + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.1);
    }

    // Bola Bate na Rede
    playNetHit() {
      if (this.muted || !this.ctx) return;
      this.ensureContext();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, t);
      osc.frequency.linearRampToValueAtTime(130, t + 0.07);

      gain.gain.setValueAtTime(0.35 * this.sfxVolume, t);
      gain.gain.linearRampToValueAtTime(0, t + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.09);
    }

    // Ativação do Golpe Especial
    playSpecial() {
      if (this.muted || !this.ctx) return;
      this.ensureContext();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, t);
      osc.frequency.exponentialRampToValueAtTime(1200, t + 0.35);

      gain.gain.setValueAtTime(0.4 * this.sfxVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.42);
      this.playSmash();
    }

    // Vibração da Torcida ao Marcar Ponto
    playCrowdCheer() {
      if (this.muted || !this.ctx) return;
      this.ensureContext();
      const t = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 1.5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(750, t);
      filter.Q.setValueAtTime(1.2, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.4 * this.sfxVolume, t + 0.2);
      gain.gain.linearRampToValueAtTime(0, t + 1.4);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(t);
    }

    // Fanfarra Triunfal de Vitória
    playVictory() {
      if (this.muted || !this.ctx) return;
      this.ensureContext();
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // C4, E4, G4, C5, E5
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          if (!this.ctx) return;
          const t = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.35 * this.sfxVolume, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.55);
        }, idx * 110);
      });
      setTimeout(() => this.playCrowdCheer(), 450);
    }

    // Som de Derrota
    playDefeat() {
      if (this.muted || !this.ctx) return;
      this.ensureContext();
      const notes = [392.00, 369.99, 349.23, 311.13];
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          if (!this.ctx) return;
          const t = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.3 * this.sfxVolume, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.65);
        }, idx * 180);
      });
    }

    // Clique de Botão / Interface
    playClick() {
      if (this.muted || !this.ctx) return;
      this.ensureContext();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, t);
      osc.frequency.exponentialRampToValueAtTime(350, t + 0.05);
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, t);
      gain.gain.linearRampToValueAtTime(0, t + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.06);
    }
  }

  /* ==========================================================================
     2. BANCO DE DADOS DE ATLETAS, ARENAS E ITENS
     ========================================================================== */
  const ATHLETES = [
    {
      id: 'rafa',
      name: 'RAFA',
      nickname: 'O Raçudo de Copacabana',
      avatarChar: 'R',
      speed: 78,
      power: 74,
      defense: 84,
      control: 76,
      specialName: 'Chicote do Litoral',
      skinTone: '#d49b6a',
      hairColor: '#2b1d0c',
      jerseyColor: '#00d2ff',
      shortsColor: '#07192f',
      unlocked: true,
      price: 0
    },
    {
      id: 'leo',
      name: 'LEO',
      nickname: 'O Flecha de Ipanema',
      avatarChar: 'L',
      speed: 92,
      power: 68,
      defense: 86,
      control: 72,
      specialName: 'Arrancada Relâmpago',
      skinTone: '#e8be96',
      hairColor: '#e0a96d',
      jerseyColor: '#fb5607',
      shortsColor: '#1d2d44',
      unlocked: true,
      price: 0
    },
    {
      id: 'kai',
      name: 'KAI',
      nickname: 'O Rei do Shark Attack',
      avatarChar: 'K',
      speed: 68,
      power: 96,
      defense: 68,
      control: 74,
      specialName: 'Shark Attack Meteórico',
      skinTone: '#9c6644',
      hairColor: '#111111',
      jerseyColor: '#ff006e',
      shortsColor: '#0a0a0a',
      unlocked: true,
      price: 0
    },
    {
      id: 'bruno',
      name: 'BRUNO',
      nickname: 'Gigante da Barra',
      avatarChar: 'B',
      speed: 70,
      power: 84,
      defense: 92,
      control: 66,
      specialName: 'Muralha de Areia',
      skinTone: '#c68642',
      hairColor: '#4a2810',
      jerseyColor: '#2a9d8f',
      shortsColor: '#264653',
      unlocked: false,
      price: 800
    },
    {
      id: 'miguel',
      name: 'MIGUEL',
      nickname: 'O Mago das Curvas',
      avatarChar: 'M',
      speed: 75,
      power: 72,
      defense: 72,
      control: 96,
      specialName: 'Curva Fantasma',
      skinTone: '#b07d50',
      hairColor: '#1a1a1a',
      jerseyColor: '#7209b7',
      shortsColor: '#3a0ca3',
      unlocked: false,
      price: 1200
    },
    {
      id: 'davi',
      name: 'DAVI',
      nickname: 'Lenda da Praia do Leblon',
      avatarChar: 'D',
      speed: 90,
      power: 90,
      defense: 90,
      control: 92,
      specialName: 'Bicicleta Celestial',
      skinTone: '#8d5524',
      hairColor: '#111111',
      jerseyColor: '#ffbe0b',
      shortsColor: '#111111',
      unlocked: false,
      price: 2500
    }
  ];

  const ARENAS = [
    {
      id: 'beach',
      name: 'Praia Tropical',
      badge: '☀️ DIA',
      desc: 'Sol brilhante, mar azul e brisa costeira',
      skyGradient: ['#38bdf8', '#7dd3fc', '#bae6fd'],
      sandColor: '#fcd34d',
      sandShade: '#f59e0b',
      seaColor: '#0284c7',
      netPole: '#f8fafc',
      isNight: false,
      unlocked: true,
      price: 0
    },
    {
      id: 'sunset',
      name: 'Arena Sunset',
      badge: '🌅 PÔR DO SOL',
      desc: 'Clima quente com céu dourado e tochas acesas',
      skyGradient: ['#31103f', '#7b1e4f', '#f97316', '#fde047'],
      sandColor: '#f59e0b',
      sandShade: '#b45309',
      seaColor: '#9f1239',
      netPole: '#fbbf24',
      isNight: false,
      unlocked: true,
      price: 0
    },
    {
      id: 'night',
      name: 'Arena Noturna',
      badge: '🌙 NOITE',
      desc: 'Refletores profissionais e atmosfera de final',
      skyGradient: ['#030712', '#0f172a', '#1e293b'],
      sandColor: '#d97706',
      sandShade: '#92400e',
      seaColor: '#0f172a',
      netPole: '#38bdf8',
      isNight: true,
      unlocked: true,
      price: 0
    }
  ];

  const CUSTOM_ITEMS = {
    shirts: [
      { id: 'shirt_cyan', name: 'Azul Celeste', color: '#00d2ff', price: 0, unlocked: true },
      { id: 'shirt_gold', name: 'Ouro Tropical', color: '#ffbe0b', price: 300, unlocked: false },
      { id: 'shirt_fire', name: 'Chama Viva', color: '#ff006e', price: 500, unlocked: false },
      { id: 'shirt_lime', name: 'Neon Volt', color: '#39ff14', price: 700, unlocked: false },
      { id: 'shirt_dark', name: 'Midnight Pro', color: '#111827', price: 900, unlocked: false }
    ],
    shorts: [
      { id: 'shorts_navy', name: 'Azul Marinho', color: '#07192f', price: 0, unlocked: true },
      { id: 'shorts_white', name: 'Branco Areia', color: '#ffffff', price: 250, unlocked: false },
      { id: 'shorts_black', name: 'Preto Clássico', color: '#18181b', price: 400, unlocked: false },
      { id: 'shorts_red', name: 'Vermelho Rio', color: '#e11d48', price: 600, unlocked: false }
    ],
    balls: [
      { id: 'ball_mikasa', name: 'Mikasa Amarela & Azul', primary: '#ffbe0b', secondary: '#0284c7', price: 0, unlocked: true },
      { id: 'ball_sunset', name: 'Sunset Laranja & Roxa', primary: '#f97316', secondary: '#7c3aed', price: 400, unlocked: false },
      { id: 'ball_neon', name: 'Neon Cyberpunk', primary: '#39ff14', secondary: '#050505', price: 800, unlocked: false },
      { id: 'ball_gold', name: 'Bola de Ouro Especial', primary: '#ffd700', secondary: '#ffffff', price: 1500, unlocked: false }
    ],
    accessories: [
      { id: 'acc_none', name: 'Nenhum', type: 'none', price: 0, unlocked: true },
      { id: 'acc_bandana', name: 'Bandana de Areia', type: 'bandana', color: '#ffffff', price: 350, unlocked: false },
      { id: 'acc_sunglasses', name: 'Óculos Polarizados', type: 'glasses', color: '#111111', price: 600, unlocked: false },
      { id: 'acc_cap', name: 'Boné Pro Aba Reta', type: 'cap', color: '#ff006e', price: 800, unlocked: false }
    ],
    trails: [
      { id: 'trail_sand', name: 'Poeira de Areia', type: 'sand', price: 0, unlocked: true },
      { id: 'trail_sparks', name: 'Faíscas de Energia', type: 'sparks', price: 500, unlocked: false },
      { id: 'trail_fire', name: 'Rastro de Chamas', type: 'fire', price: 1000, unlocked: false },
      { id: 'trail_rainbow', name: 'Arco-Íris Mágico', type: 'rainbow', price: 1800, unlocked: false }
    ]
  };

  const ACHIEVEMENTS_LIST = [
    { id: 'first_point', title: 'Primeiro Ponto', desc: 'Marque o seu primeiro ponto no futevôlei.', icon: '🎯', reward: 100 },
    { id: 'first_win', title: 'Primeira Vitória', desc: 'Vença a sua primeira partida.', icon: '🏆', reward: 250 },
    { id: 'shark_attack', title: 'Tubarão da Rede', desc: 'Execute um Shark Attack fulminante no ataque.', icon: '🦈', reward: 200 },
    { id: 'combo_5', title: 'Rally Furioso', desc: 'Atinja um Rally Combo de 5x trocas de bola.', icon: '⚡', reward: 300 },
    { id: 'defense_master', title: 'Paredão de Areia', desc: 'Realize 5 defesas difíceis na mesma partida.', icon: '🛡️', reward: 350 },
    { id: 'special_spike', title: 'Poder Máximo', desc: 'Marque um ponto utilizando o Golpe Especial.', icon: '💥', reward: 300 },
    { id: 'tournament_champ', title: 'Campeão da Areia', desc: 'Vença a Grande Final do Campeonato!', icon: '👑', reward: 1500 },
    { id: 'legend_killer', title: 'Derrubador de Mitos', desc: 'Vença a IA na dificuldade LENDA.', icon: '🦁', reward: 1000 }
  ];

  /* ==========================================================================
     3. SISTEMA DE SALVAMENTO LOCAL (localStorage)
     ========================================================================== */
  class SaveSystem {
    constructor() {
      this.STORAGE_KEY = 'futevolei_arena_save_v2';
      this.data = this.getDefaults();
      this.load();
    }

    getDefaults() {
      return {
        coins: 600,
        xp: 120,
        level: 1,
        stats: {
          matches: 0,
          wins: 0,
          losses: 0,
          pointsScored: 0,
          aces: 0,
          smashes: 0,
          defenses: 0,
          maxCombo: 0
        },
        unlockedAthletes: ['rafa', 'leo', 'kai'],
        unlockedArenas: ['beach', 'sunset', 'night'],
        unlockedItems: {
          shirts: ['shirt_cyan'],
          shorts: ['shorts_navy'],
          balls: ['ball_mikasa'],
          accessories: ['acc_none'],
          trails: ['trail_sand']
        },
        equipped: {
          athleteId: 'rafa',
          shirt: 'shirt_cyan',
          shorts: 'shorts_navy',
          ball: 'ball_mikasa',
          accessory: 'acc_none',
          trail: 'trail_sand'
        },
        tournament: {
          stage: 0, // 0: QF, 1: SF, 2: Final, 3: Concluído
          qfOpponent: 'bruno',
          sfOpponent: 'leo',
          finalOpponent: 'davi',
          scores: {}
        },
        achievements: [],
        settings: {
          sfxVolume: 80,
          ambientVolume: 60,
          screenshake: true,
          particles: 'high',
          forceTouch: false
        }
      };
    }

    load() {
      try {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          this.data = Object.assign(this.getDefaults(), parsed);
        }
      } catch (e) {
        console.warn('Erro ao carregar do localStorage:', e);
        this.data = this.getDefaults();
      }
    }

    save() {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
      } catch (e) {
        console.warn('Erro ao salvar no localStorage:', e);
      }
    }

    addCoins(amount) {
      this.data.coins += amount;
      this.save();
      updateHeaderBadges();
    }

    addXP(amount) {
      this.data.xp += amount;
      // Fórmula de Nível: Nível 1: 100XP, Nível 2: 250XP, Nível 5+: escala progressiva
      const xpNeeded = this.data.level * 180;
      if (this.data.xp >= xpNeeded) {
        this.data.xp -= xpNeeded;
        this.data.level += 1;
        this.addCoins(this.data.level * 100);
      }
      this.save();
      updateHeaderBadges();
    }

    unlockAchievement(id) {
      if (!this.data.achievements.includes(id)) {
        this.data.achievements.push(id);
        const ach = ACHIEVEMENTS_LIST.find(a => a.id === id);
        if (ach) {
          this.addCoins(ach.reward);
          showPointNotification('🏆 CONQUISTA!', ach.title);
        }
        this.save();
      }
    }

    resetAll() {
      this.data = this.getDefaults();
      this.save();
      location.reload();
    }
  }

  const saveSys = new SaveSystem();
  const audio = new AudioSystem();

  /* ==========================================================================
     4. SISTEMA DE PARTÍCULAS E EFEITOS VISUAIS
     ========================================================================== */
  class ParticleSystem {
    constructor() {
      this.particles = [];
      this.shockwaves = [];
    }

    addSandPuff(x, y, count = 10, speed = 3) {
      for (let i = 0; i < count; i++) {
        const angle = Math.PI + (Math.random() - 0.5) * 1.6;
        const s = (Math.random() * 0.7 + 0.3) * speed;
        this.particles.push({
          type: 'sand',
          x: x + (Math.random() - 0.5) * 16,
          y: y + (Math.random() - 0.5) * 6,
          vx: Math.cos(angle) * s,
          vy: Math.sin(angle) * s - Math.random() * 1.8,
          radius: Math.random() * 3 + 2,
          color: Math.random() > 0.4 ? '#fcd34d' : '#f59e0b',
          alpha: 1,
          life: 1,
          decay: Math.random() * 0.03 + 0.02
        });
      }
    }

    addHitImpact(x, y, isSpecial = false) {
      const count = isSpecial ? 30 : 14;
      const colors = isSpecial
        ? ['#ffbe0b', '#fb5607', '#ff006e', '#39ff14']
        : ['#ffffff', '#00d2ff', '#ffe066'];

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (Math.random() * 4 + 2) * (isSpecial ? 1.8 : 1);
        this.particles.push({
          type: 'spark',
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: Math.random() * 3 + 1.5,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          life: 1,
          decay: Math.random() * 0.04 + 0.03
        });
      }

      this.shockwaves.push({
        x,
        y,
        radius: 10,
        maxRadius: isSpecial ? 85 : 45,
        alpha: 1,
        color: isSpecial ? '#ffbe0b' : '#ffffff',
        speed: isSpecial ? 6 : 4
      });
    }

    addConfettiBurst(x, y, count = 60) {
      const colors = ['#00d2ff', '#ffbe0b', '#ff006e', '#39ff14', '#ffffff', '#fb5607'];
      for (let i = 0; i < count; i++) {
        const angle = (Math.random() * 0.8 + 0.1) * -Math.PI;
        const speed = Math.random() * 8 + 4;
        this.particles.push({
          type: 'confetti',
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          w: Math.random() * 8 + 4,
          h: Math.random() * 5 + 3,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.3,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          life: 1,
          decay: Math.random() * 0.015 + 0.008
        });
      }
    }

    update() {
      // Atualizar partículas
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        p.alpha = Math.max(0, p.life);

        if (p.type === 'sand' || p.type === 'confetti') {
          p.vy += 0.18; // Gravidade
        }
        if (p.type === 'confetti') {
          p.rotation += p.vRot;
        }

        if (p.life <= 0) {
          this.particles.splice(i, 1);
        }
      }

      // Atualizar shockwaves
      for (let i = this.shockwaves.length - 1; i >= 0; i--) {
        const s = this.shockwaves[i];
        s.radius += s.speed;
        s.alpha = 1 - (s.radius / s.maxRadius);
        if (s.radius >= s.maxRadius) {
          this.shockwaves.splice(i, 1);
        }
      }
    }

    render(ctx) {
      // Renderizar shockwaves
      ctx.save();
      for (const s of this.shockwaves) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.strokeStyle = s.color;
        ctx.globalAlpha = Math.max(0, s.alpha);
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.restore();

      // Renderizar partículas
      for (const p of this.particles) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        if (p.type === 'confetti') {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        }
        ctx.restore();
      }
    }
  }

  const particles = new ParticleSystem();

  /* ==========================================================================
     5. FÍSICA E CLASSE DA BOLA DE FUTEVÔLEI
     ========================================================================== */
  class Ball {
    constructor() {
      this.reset();
      this.radius = 14;
      this.rotation = 0;
      this.trail = [];
    }

    reset(serveX = 260, serveY = 380) {
      this.x = serveX;
      this.y = serveY;
      this.vx = 0;
      this.vy = 0;
      this.spin = 0; // Rotação angular que cria efeito curva magnus
      this.inPlay = false;
      this.lastHitBy = null; // 'p1' ou 'p2'
      this.hitType = 'normal'; // 'normal', 'header', 'smash', 'special'
      this.isSpecial = false;
      this.touchCount = 0;
      this.groundHit = false;
      this.trail = [];
    }

    update(netX, netY, netHeight, courtLeft, courtRight, groundY) {
      if (!this.inPlay) return;

      // Adiciona histórico para rastro
      this.trail.push({ x: this.x, y: this.y, isSpecial: this.isSpecial });
      if (this.trail.length > (this.isSpecial ? 16 : 8)) {
        this.trail.shift();
      }

      // Efeito Magnus de curva no ar
      if (Math.abs(this.spin) > 0.05) {
        this.vx += this.spin * 0.04;
        this.spin *= 0.985;
      }

      // Gravidade e Resistência do Ar
      this.vy += 0.36;
      this.vx *= 0.996;
      this.vy *= 0.996;

      this.x += this.vx;
      this.y += this.vy;

      // Rotação visual baseada na velocidade
      this.rotation += this.vx * 0.06;

      // COLISÃO COM A REDE (Net)
      // Poste central fica em netX = 600, de netY (ex: 360) até groundY (540)
      const netThickness = 8;
      const netTopY = netY;

      // Bate no topo da rede (fita branca elástica)
      const distToNetTape = Math.hypot(this.x - netX, this.y - netTopY);
      if (distToNetTape < this.radius + 6) {
        audio.playNetHit();
        this.vy = -Math.abs(this.vy) * 0.65 - 1.5;
        this.vx *= 0.6;
        particles.addSandPuff(this.x, netTopY, 6, 2);
      } else if (
        this.y > netTopY &&
        this.y < groundY &&
        Math.abs(this.x - netX) < this.radius + netThickness
      ) {
        // Colisão direta com a malha da rede
        audio.playNetHit();
        this.x = this.x < netX ? netX - this.radius - netThickness : netX + this.radius + netThickness;
        this.vx = -this.vx * 0.38; // Amortece forte e rebate
        this.vy *= 0.8;
      }

      // Limites de teto e laterais da tela
      if (this.y < this.radius + 10) {
        this.y = this.radius + 10;
        this.vy = Math.abs(this.vy) * 0.6;
      }

      // COLISÃO COM O SOLO (Areia)
      if (this.y + this.radius >= groundY) {
        this.y = groundY - this.radius;
        this.groundHit = true;
        this.inPlay = false;
        audio.playSandBounce();
        particles.addSandPuff(this.x, groundY, 16, 3.5);
      }
    }

    render(ctx, groundY) {
      // Sombra da bola na areia
      const shadowY = groundY;
      const heightAboveGround = Math.max(0, groundY - this.y);
      const shadowScale = Math.max(0.2, 1 - heightAboveGround / 450);
      const shadowAlpha = Math.max(0.1, 0.5 - heightAboveGround / 500);

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(this.x, shadowY + 2, this.radius * shadowScale * 1.3, this.radius * shadowScale * 0.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
      ctx.fill();
      ctx.restore();

      // Renderiza Rastro da Bola
      if (this.trail.length > 1) {
        ctx.save();
        for (let i = 0; i < this.trail.length - 1; i++) {
          const pt = this.trail[i];
          const nextPt = this.trail[i + 1];
          const progress = i / this.trail.length;
          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y);
          ctx.lineTo(nextPt.x, nextPt.y);
          ctx.strokeStyle = pt.isSpecial ? '#ff006e' : 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = (this.radius * progress * 0.9);
          ctx.lineCap = 'round';
          ctx.stroke();
        }
        ctx.restore();
      }

      // Renderiza Bola de Futevôlei Estilo Mikasa Pro
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);

      // Obter cores da bola selecionada
      const ballEquipped = saveSys.data.equipped.ball || 'ball_mikasa';
      const ballData = CUSTOM_ITEMS.balls.find(b => b.id === ballEquipped) || CUSTOM_ITEMS.balls[0];

      // Base da bola
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = ballData.primary;
      ctx.fill();

      // Gomos Curvos Estilo Mikasa Beach Volley
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, -0.7, 0.7);
      ctx.lineTo(0, 0);
      ctx.fillStyle = ballData.secondary;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, 0, this.radius, Math.PI - 0.7, Math.PI + 0.7);
      ctx.lineTo(0, 0);
      ctx.fillStyle = ballData.secondary;
      ctx.fill();

      // Linhas dos gomos / costuras
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Brilho superior
      ctx.beginPath();
      ctx.arc(-this.radius * 0.35, -this.radius * 0.35, this.radius * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fill();

      ctx.restore();
    }
  }

  /* ==========================================================================
     6. CLASSE DO ATLETA (JOGADOR HUMANO E INTELIGÊNCIA ARTIFICIAL)
     ========================================================================== */
  class Player {
    constructor(athleteConfig, isAI = false, courtSide = 'left') {
      this.cfg = athleteConfig;
      this.isAI = isAI;
      this.courtSide = courtSide; // 'left' (P1) ou 'right' (CPU)
      this.width = 44;
      this.height = 92;

      this.x = courtSide === 'left' ? 300 : 900;
      this.groundY = 540;
      this.y = this.groundY;
      this.vx = 0;
      this.vy = 0;

      this.facing = courtSide === 'left' ? 1 : -1;
      this.isGrounded = true;
      this.energy = 0; // 0 a 100%
      this.touchCount = 0;

      // Animações e Estados
      this.state = 'idle'; // 'idle', 'run', 'jump', 'kick', 'header', 'smash', 'dive'
      this.stateTimer = 0;
      this.animFrame = 0;

      // IA Config
      this.aiDifficulty = 'normal'; // 'easy', 'normal', 'hard', 'legend'
      this.aiReactionTimer = 0;
      this.aiTargetX = this.x;
    }

    resetPosition() {
      this.x = this.courtSide === 'left' ? 300 : 900;
      this.y = this.groundY;
      this.vx = 0;
      this.vy = 0;
      this.isGrounded = true;
      this.state = 'idle';
      this.stateTimer = 0;
      this.touchCount = 0;
      this.facing = this.courtSide === 'left' ? 1 : -1;
    }

    addEnergy(val) {
      this.energy = Math.min(100, this.energy + val);
    }

    update(ball, netX, courtMinX, courtMaxX, inputState) {
      this.animFrame++;

      // Gerencia temporizador de estados de ação (chute, cabeceio, etc.)
      if (this.stateTimer > 0) {
        this.stateTimer--;
        if (this.stateTimer === 0) {
          this.state = this.isGrounded ? 'idle' : 'jump';
        }
      }

      // CONTROLES: JOGADOR HUMANO OU IA
      if (!this.isAI) {
        this.handleHumanInput(inputState, ball);
      } else {
        this.handleAIBehavior(ball, netX, courtMinX, courtMaxX);
      }

      // Aplica Física e Movimento
      this.x += this.vx;
      this.y += this.vy;

      // Gravidade
      if (!this.isGrounded) {
        this.vy += 0.52;
        if (this.y >= this.groundY) {
          this.y = this.groundY;
          this.vy = 0;
          this.isGrounded = true;
          this.state = 'idle';
          particles.addSandPuff(this.x, this.groundY, 8, 2);
        }
      }

      // Limites da Quadra
      if (this.courtSide === 'left') {
        this.x = Math.max(courtMinX, Math.min(netX - 25, this.x));
      } else {
        this.x = Math.max(netX + 25, Math.min(courtMaxX, this.x));
      }

      // Atrito na areia
      if (this.isGrounded) {
        this.vx *= 0.78;
        if (Math.abs(this.vx) < 0.1) this.vx = 0;
      }
    }

    handleHumanInput(keys, ball) {
      const moveSpeed = (this.cfg.speed / 100) * 5.8 + 2.4;

      if (keys.left) {
        this.vx = -moveSpeed;
        this.facing = -1;
        if (this.isGrounded && this.state !== 'kick') this.state = 'run';
      } else if (keys.right) {
        this.vx = moveSpeed;
        this.facing = 1;
        if (this.isGrounded && this.state !== 'kick') this.state = 'run';
      }

      // Pulo / Impulsão
      if (keys.jump && this.isGrounded) {
        this.vy = -12.4;
        this.isGrounded = false;
        this.state = 'jump';
        particles.addSandPuff(this.x, this.groundY, 12, 3);
      }

      // Amortecer / Abaixar no Peito (Tecla S ou Seta Baixo)
      if (keys.down && this.isGrounded) {
        this.state = 'cushion';
        this.vx *= 0.4;
        const hitBoxCenterY = this.y - 50;
        const dist = Math.hypot(ball.x - this.x, ball.y - hitBoxCenterY);
        if (dist < 55 && this.stateTimer === 0) {
          audio.playCushion();
          particles.addSandPuff(this.x, this.groundY, 6, 2);
          this.touchCount++;
          ball.lastHitBy = this.courtSide === 'left' ? 'p1' : 'p2';
          ball.hitType = 'cushion';
          ball.vx = this.facing * 2.2;
          ball.vy = -12.8; // Levanta bola perfeita alta para o ataque!
          ball.spin = 0;
          this.addEnergy(15);
          this.stateTimer = 18;
          saveSys.data.stats.defenses++;
          saveSys.unlockAchievement('defense_master');
          window.onBallContact?.(this, ball);
          showPointNotification('AMORTECIDA NO PEITO', 'Bola perfeita para o ataque!');
        }
      }

      // Executar Golpes
      if (keys.kick && this.stateTimer === 0) {
        this.performKick(ball, false);
      } else if (keys.header && this.stateTimer === 0) {
        this.performHeader(ball);
      } else if (keys.special && this.energy >= 100 && this.stateTimer === 0) {
        this.performSpecialAttack(ball);
      }
    }

    handleAIBehavior(ball, netX, courtMinX, courtMaxX) {
      const diff = this.aiDifficulty;
      let reactionSpeed = 0.85;
      let errorMargin = 0;
      let attackAggressiveness = 0.5;

      if (diff === 'easy') {
        reactionSpeed = 0.55;
        errorMargin = 55;
        attackAggressiveness = 0.2;
      } else if (diff === 'normal') {
        reactionSpeed = 0.75;
        errorMargin = 25;
        attackAggressiveness = 0.55;
      } else if (diff === 'hard') {
        reactionSpeed = 0.95;
        errorMargin = 8;
        attackAggressiveness = 0.85;
      } else if (diff === 'legend') {
        reactionSpeed = 1.1;
        errorMargin = 2;
        attackAggressiveness = 0.98;
      }

      const moveSpeed = ((this.cfg.speed / 100) * 5.2 + 2.0) * reactionSpeed;

      // Calcular onde a bola vai estar / onde interceptar
      if (ball.inPlay && ball.x > netX - 40) {
        // Bola está no campo da CPU ou vindo para ele
        const distToBall = ball.x - this.x;
        const leadFrames = Math.max(0, Math.min(10, Math.abs(ball.vx) * 0.65));
        const targetX = ball.x + (ball.vx * leadFrames) + (Math.sin(this.animFrame * 0.05) * errorMargin);

        if (Math.abs(distToBall) > 18) {
          this.vx = Math.sign(targetX - this.x) * moveSpeed;
          this.facing = -1;
          if (this.isGrounded) this.state = 'run';
        }

        // Pular se a bola estiver alta
        const ballHeightDiff = (this.y - 45) - ball.y;
        if (Math.abs(distToBall) < 45 && ballHeightDiff > 45 && ballHeightDiff < 140 && this.isGrounded) {
          if (Math.random() < attackAggressiveness) {
            this.vy = -12.2;
            this.isGrounded = false;
            this.state = 'jump';
          }
        }

        // Tentar Golpear a bola quando próxima
        // Janela de contato mais generosa: a IA precisa conseguir alcançar a bola
        // mesmo quando a animação do salto ainda não chegou ao ponto mais alto.
        const dist = Math.hypot(ball.x - this.x, ball.y - (this.y - 30));
        // A CPU precisa primeiro recepcionar a bola; usa a mesma altura do hitbox
        // do chute e uma margem maior para compensar a movimentação em pixels por frame.
        if (dist < 72 && this.stateTimer === 0 && ball.x > netX + 8) {
          // Prioriza um toque controlado e alto para devolver a bola por cima da rede.
          // Cortadas para baixo eram disparadas cedo demais e faziam a CPU errar a rede.
          if (this.energy >= 100 && dist < 48 && Math.random() < attackAggressiveness * 0.45) {
            this.performSpecialAttack(ball);
            if (ball.lastHitBy === 'p2') {
              ball.vx = -Math.max(9.5, Math.abs(ball.vx));
              ball.vy = -Math.max(8.5, Math.abs(ball.vy));
              ball.isSpecial = true;
            }
          } else if (ball.y < this.y - 52) {
            this.performHeader(ball);
          } else {
            this.performKick(ball, false);
          }
        }
      } else {
        // Bola está do outro lado: recua para posição de guarda
        const homeX = 900;
        if (Math.abs(this.x - homeX) > 20) {
          this.vx = Math.sign(homeX - this.x) * (moveSpeed * 0.6);
          this.facing = -1;
          if (this.isGrounded) this.state = 'run';
        }
      }
    }

    performKick(ball, strong = false) {
      // Hitbox mais generosa, principalmente no eixo vertical, para facilitar
      // o contato com a bola durante a partida 2D.
      const hitBoxCenterY = this.y - (this.isGrounded ? 34 : 48);
      const dx = ball.x - this.x;
      const dy = ball.y - hitBoxCenterY;
      const dist = Math.hypot(dx, dy);
      const hitRange = this.isAI ? 100 : (this.isGrounded ? 112 : 126);

      // Não iniciar a animação nem bloquear novas tentativas se o chute não acertou.
      if (dist >= hitRange || !ball.inPlay) return;

      this.state = 'kick';
      this.stateTimer = 12;
      {
        audio.playKick(strong ? 1.3 : 1.0);
        particles.addHitImpact(ball.x, ball.y, strong);

        this.touchCount++;
        ball.lastHitBy = this.courtSide === 'left' ? 'p1' : 'p2';
        ball.hitType = strong ? 'smash' : 'normal';

        // Vetor de lançamento
        const powerMult = (this.cfg.power / 100) * 0.4 + 0.8;
        const dir = this.courtSide === 'left' ? 1 : -1;

        if (this.isAI) {
          // A CPU deve conseguir passar a bola por cima da rede; não usar
          // a trajetória descendente de smash, que frequentemente acertava a rede.
          ball.vx = dir * (10.0 * powerMult);
          ball.vy = -10.2 * powerMult;
        } else if (this.isGrounded) {
          ball.vx = dir * (9.0 * powerMult);
          ball.vy = -10.0 * powerMult;
        } else {
          // Chute no ar: ataque forte, mas com elevação suficiente para
          // registrar o contato e permitir a continuidade da jogada.
          ball.vx = dir * (10.5 * powerMult);
          ball.vy = -4.0 * powerMult;
          audio.playSmash();
          saveSys.data.stats.smashes++;
          saveSys.unlockAchievement('shark_attack');
        }

        ball.spin = dir * 1.5;
        this.addEnergy(14);
        window.onBallContact?.(this, ball);
      }
    }

    performHeader(ball) {
      this.state = 'header';
      this.stateTimer = 16;

      const hitBoxCenterY = this.y - 75;
      const dist = Math.hypot(ball.x - this.x, ball.y - hitBoxCenterY);

      if (dist < (this.isAI ? 82 : 55)) {
        audio.playHeader();
        particles.addHitImpact(ball.x, ball.y, false);

        this.touchCount++;
        ball.lastHitBy = this.courtSide === 'left' ? 'p1' : 'p2';
        ball.hitType = 'header';

        const dir = this.courtSide === 'left' ? 1 : -1;
        const powerMult = (this.cfg.control / 100) * 0.3 + 0.85;

        // Cabeceio direcionado para os cantos
        ball.vx = dir * (this.isAI ? 10.0 * powerMult : 9.0 * powerMult);
        ball.vy = -(this.isAI ? 10.0 : 7.5) * powerMult;
        ball.spin = -dir * 1.2;

        this.addEnergy(16);
        window.onBallContact?.(this, ball);
      }
    }

    performSmash(ball) {
      this.performKick(ball, true);
    }

    performSpecialAttack(ball) {
      const hitBoxCenterY = this.y - 45;
      const dist = Math.hypot(ball.x - this.x, ball.y - hitBoxCenterY);

      if (dist < 60) {
        this.energy = 0;
        this.state = 'kick';
        this.stateTimer = 20;

        audio.playSpecial();
        particles.addHitImpact(ball.x, ball.y, true);
        showPointNotification('💥 ESPECIAL!', `${this.cfg.name}: ${this.cfg.specialName}`);

        ball.lastHitBy = this.courtSide === 'left' ? 'p1' : 'p2';
        ball.hitType = 'special';
        ball.isSpecial = true;
        this.touchCount++;

        const dir = this.courtSide === 'left' ? 1 : -1;
        ball.vx = dir * 15.5;
        ball.vy = 2.0; // Cortada rasante com efeito
        ball.spin = dir * 3.5;

        triggerScreenShake(18);
        saveSys.unlockAchievement('special_spike');
        window.onBallContact?.(this, ball);
      }
    }

    render(ctx) {
      // Sombra na areia
      const shadowY = this.groundY;
      const heightAboveGround = Math.max(0, this.groundY - this.y);
      const shadowScale = Math.max(0.4, 1 - heightAboveGround / 250);

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(this.x, shadowY + 2, 24 * shadowScale, 9 * shadowScale, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
      ctx.fill();
      ctx.restore();

      // Renderização Procedural Articulada do Atleta de Praia
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.scale(this.facing, 1);

      // Usar cores customizadas se for o jogador 1 (Humano)
      let jersey = this.cfg.jerseyColor;
      let shorts = this.cfg.shortsColor;
      if (!this.isAI) {
        const eqShirt = CUSTOM_ITEMS.shirts.find(s => s.id === saveSys.data.equipped.shirt);
        if (eqShirt) jersey = eqShirt.color;
        const eqShorts = CUSTOM_ITEMS.shorts.find(s => s.id === saveSys.data.equipped.shorts);
        if (eqShorts) shorts = eqShorts.color;
      }

      const skin = this.cfg.skinTone;
      const hair = this.cfg.hairColor;

      // Animações de Pernas (Corrida / Pulo / Chute)
      let legAngleL = 0;
      let legAngleR = 0;
      if (this.state === 'run') {
        legAngleL = Math.sin(this.animFrame * 0.3) * 0.45;
        legAngleR = -legAngleL;
      } else if (this.state === 'jump') {
        legAngleL = -0.3;
        legAngleR = 0.2;
      } else if (this.state === 'kick') {
        legAngleR = -1.2; // Perna esticada chutando para frente!
        legAngleL = 0.2;
      }

      // Perna Esquerda
      ctx.save();
      ctx.translate(-6, -42);
      ctx.rotate(legAngleL);
      ctx.fillStyle = skin;
      ctx.fillRect(-4, 0, 8, 42);
      // Pés descalços na areia
      ctx.fillStyle = '#fcd34d';
      ctx.fillRect(-4, 38, 12, 4);
      ctx.restore();

      // Perna Direita
      ctx.save();
      ctx.translate(6, -42);
      ctx.rotate(legAngleR);
      ctx.fillStyle = skin;
      ctx.fillRect(-4, 0, 8, 42);
      ctx.fillStyle = '#fcd34d';
      ctx.fillRect(-4, 38, 12, 4);
      ctx.restore();

      // Bermuda / Shorts
      ctx.fillStyle = shorts;
      ctx.beginPath();
      ctx.roundRect(-14, -46, 28, 20, [4, 4, 2, 2]);
      ctx.fill();

      // Tronco e Camisa / Regata
      ctx.fillStyle = jersey;
      ctx.beginPath();
      ctx.roundRect(-12, -74, 24, 30, [6, 6, 2, 2]);
      ctx.fill();

      // Braço e Ombros
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.arc(-10, -70, 5, 0, Math.PI * 2);
      ctx.arc(10, -70, 5, 0, Math.PI * 2);
      ctx.fill();

      // Cabeça e Rosto
      ctx.beginPath();
      ctx.arc(0, -84, 11, 0, Math.PI * 2);
      ctx.fillStyle = skin;
      ctx.fill();

      // Cabelo
      ctx.fillStyle = hair;
      ctx.beginPath();
      ctx.arc(0, -88, 11, Math.PI, Math.PI * 2);
      ctx.fill();

      // Acessório na cabeça (Óculos ou Boné se equipado)
      if (!this.isAI && saveSys.data.equipped.accessory === 'acc_sunglasses') {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(1, -85, 8, 4);
      } else if (!this.isAI && saveSys.data.equipped.accessory === 'acc_cap') {
        ctx.fillStyle = '#ff006e';
        ctx.beginPath();
        ctx.arc(0, -89, 12, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(0, -89, 14, 3); // Aba
      }

      ctx.restore();
    }
  }

  /* ==========================================================================
     7. RENDERIZADOR DA ARENA E ELEMENTOS VISUAIS DA QUADRA
     ========================================================================== */
  class CourtRenderer {
    constructor() {
      this.waveOffset = 0;
      this.crowd = [];
      this.initCrowd();
    }

    initCrowd() {
      // Gera torcedores animados na arquibancada
      const colors = ['#00d2ff', '#ffbe0b', '#ff006e', '#39ff14', '#ffffff', '#fb5607', '#a855f7'];
      for (let i = 0; i < 42; i++) {
        this.crowd.push({
          x: 40 + i * 27,
          y: 440 + (i % 2) * 12,
          shirt: colors[Math.floor(Math.random() * colors.length)],
          bounceOffset: Math.random() * Math.PI * 2,
          waving: Math.random() > 0.6
        });
      }
    }

    render(ctx, width, height, currentArenaId, isCheering = false) {
      const arena = ARENAS.find(a => a.id === currentArenaId) || ARENAS[0];
      this.waveOffset += 0.04;

      // 1. Céu Dinâmico com Gradiente
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 420);
      arena.skyGradient.forEach((color, idx) => {
        skyGrad.addColorStop(idx / (arena.skyGradient.length - 1), color);
      });
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, 440);

      // Sol ou Lua / Iluminação
      if (!arena.isNight) {
        ctx.save();
        ctx.beginPath();
        const sunX = arena.id === 'sunset' ? 600 : 250;
        const sunY = arena.id === 'sunset' ? 280 : 110;
        const sunGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 140);
        sunGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        sunGrad.addColorStop(0.3, arena.id === 'sunset' ? 'rgba(251, 86, 7, 0.7)' : 'rgba(255, 230, 100, 0.5)');
        sunGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = sunGrad;
        ctx.arc(sunX, sunY, 140, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        // Arena Noturna: Refletores de Estádio
        ctx.save();
        [160, 1040].forEach(lx => {
          const beamGrad = ctx.createRadialGradient(lx, 80, 5, lx, 400, 360);
          beamGrad.addColorStop(0, 'rgba(0, 210, 255, 0.5)');
          beamGrad.addColorStop(1, 'rgba(0, 210, 255, 0)');
          ctx.fillStyle = beamGrad;
          ctx.beginPath();
          ctx.moveTo(lx - 20, 80);
          ctx.lineTo(lx + 20, 80);
          ctx.lineTo(lx + 240, 540);
          ctx.lineTo(lx - 240, 540);
          ctx.closePath();
          ctx.fill();
        });
        ctx.restore();
      }

      // 2. Mar com Ondas Animadas
      ctx.save();
      ctx.fillStyle = arena.seaColor;
      ctx.beginPath();
      ctx.moveTo(0, 410);
      for (let x = 0; x <= width; x += 40) {
        const y = 410 + Math.sin(x * 0.02 + this.waveOffset) * 6;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, 460);
      ctx.lineTo(0, 460);
      ctx.closePath();
      ctx.fill();

      // Espuma das ondas
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();

      // 3. Arquibancada e Torcida
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(0, 435, width, 55);

      this.crowd.forEach(person => {
        const cheerBounce = isCheering ? Math.sin(this.waveOffset * 6 + person.bounceOffset) * 7 : 0;
        ctx.fillStyle = person.shirt;
        ctx.beginPath();
        ctx.arc(person.x, person.y + cheerBounce - 8, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(person.x - 4, person.y + cheerBounce - 4, 8, 12);
      });

      // 4. Areia da Quadra de Futevôlei
      const groundY = 540;
      const sandGrad = ctx.createLinearGradient(0, 480, 0, height);
      sandGrad.addColorStop(0, arena.sandShade);
      sandGrad.addColorStop(0.3, arena.sandColor);
      sandGrad.addColorStop(1, arena.sandShade);
      ctx.fillStyle = sandGrad;
      ctx.fillRect(0, 480, width, height - 480);

      // Linhas da Quadra (Fitas de Marcação de Praia)
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 4;
      ctx.beginPath();
      // Linha de fundo esquerda (80) até linha de fundo direita (1120)
      ctx.moveTo(80, groundY + 1);
      ctx.lineTo(1120, groundY + 1);
      ctx.stroke();

      // Estacas de canto
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(78, groundY - 8, 4, 10);
      ctx.fillRect(1118, groundY - 8, 4, 10);

      // Alvo visual iluminado no chão se for Treino de Saque
      if (window.activeDrillType === 'serve') {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 190, 11, 0.22)';
        ctx.strokeStyle = '#ffbe0b';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);
        ctx.strokeRect(860, 490, 200, 48);
        ctx.fillRect(860, 490, 200, 48);

        ctx.font = 'bold 13px Outfit, sans-serif';
        ctx.fillStyle = '#ffbe0b';
        ctx.textAlign = 'center';
        ctx.fillText('🎯 ÁREA ALVO DE SAQUE', 960, 520);
        ctx.restore();
      }

      // 5. Rede Oficial de Futevôlei (Central em X = 600)
      const netX = 600;
      const netTopY = 360;
      const netBottomY = 540;

      // Postes de sustentação
      ctx.fillStyle = arena.netPole;
      ctx.fillRect(netX - 3, netTopY - 20, 6, netBottomY - netTopY + 20);

      // Fita Superior da Rede (Branca)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(netX - 8, netTopY, 16, 7);

      // Fita Inferior da Rede
      ctx.fillRect(netX - 6, netBottomY - 10, 12, 5);

      // Malha quadriculada da rede
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = 1;
      for (let y = netTopY + 7; y < netBottomY - 10; y += 12) {
        ctx.beginPath();
        ctx.moveTo(netX - 5, y);
        ctx.lineTo(netX + 5, y);
        ctx.stroke();
      }

      // Antenas Regulamentares (Vermelha e Branca)
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(netX - 7, netTopY - 35, 2, 40);
      ctx.fillRect(netX + 5, netTopY - 35, 2, 40);
    }
  }

  /* ==========================================================================
     8. COORDENADOR DA PARTIDA E REGRAS DO JOGO
     ========================================================================== */
  class MatchManager {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.court = new CourtRenderer();
      this.ball = new Ball();

      this.p1 = null;
      this.p2 = null;

      this.scoreP1 = 0;
      this.scoreP2 = 0;
      this.targetScore = 12;
      this.server = 'p1'; // 'p1' ou 'p2'

      this.matchMode = 'quick'; // 'quick', 'tournament', 'training'
      this.drillType = null;
      this.currentArenaId = 'beach';
      this.isPaused = false;
      this.isMatchOver = false;

      this.pointPauseTimer = 0;
      this.serveReadyTimer = 0;
      this.rallyHits = 0;
      this.maxRallyCombo = 0;

      this.stats = {
        aces: 0,
        smashes: 0,
        defenses: 0,
        maxCombo: 0
      };

      this.shakeIntensity = 0;
      this.inputState = {
        left: false,
        right: false,
        jump: false,
        down: false,
        kick: false,
        header: false,
        special: false
      };

      this.setupWindowEvents();
    }

    startMatch(p1Athlete, p2Athlete, difficulty = 'normal', arenaId = 'beach', points = 12, mode = 'quick', drillType = null) {
      this.matchMode = mode;
      this.drillType = drillType;
      window.activeDrillType = drillType;
      this.targetScore = points;
      this.currentArenaId = arenaId;

      this.p1 = new Player(p1Athlete, false, 'left');
      this.p2 = new Player(p2Athlete, true, 'right');
      this.p2.aiDifficulty = difficulty;

      this.scoreP1 = 0;
      this.scoreP2 = 0;
      this.server = 'p1';
      this.rallyHits = 0;
      this.maxRallyCombo = 0;
      this.isMatchOver = false;
      this.isPaused = false;

      this.stats = { aces: 0, smashes: 0, defenses: 0, maxCombo: 0 };

      // Configura HUD
      document.getElementById('p1-name-display').innerText = this.p1.cfg.name;
      document.getElementById('p2-name-display').innerText = `${this.p2.cfg.name} (${difficulty.toUpperCase()})`;
      document.getElementById('p1-avatar-icon').innerText = this.p1.cfg.avatarChar;
      document.getElementById('p2-avatar-icon').innerText = this.p2.cfg.avatarChar;
      document.getElementById('hud-target-score').innerText = `ALVO: ${this.targetScore} PTS`;

      const modeTitle = mode === 'tournament' ? 'CAMPEONATO' : (mode === 'training' ? `TREINO (${(drillType || 'LIVRE').toUpperCase()})` : 'PARTIDA RÁPIDA');
      document.getElementById('hud-match-mode-title').innerText = modeTitle;

      this.updateHUD();
      this.prepareServe(this.server);

      audio.playWhistle(true);
      showPointNotification('INÍCIO DE JOGO!', 'Vence quem fizer ' + this.targetScore + ' pontos');
    }

    prepareServe(server) {
      this.server = server;
      this.p1.resetPosition();
      this.p2.resetPosition();

      this.rallyHits = 0;
      hideComboBanner();

      // Configurações personalizadas por tipo de treino
      if (this.drillType === 'attack') {
        this.ball.reset(480, 240);
        this.ball.inPlay = true;
        this.ball.vx = 0.5;
        this.ball.vy = -10.0;
        this.ball.lastHitBy = 'p1';
        this.server = 'p1';
        this.updateHUD();
        return;
      }
      if (this.drillType === 'defense') {
        this.ball.reset(950, 360);
        this.ball.inPlay = true;
        this.ball.vx = -10.5;
        this.ball.vy = -6.2;
        this.ball.lastHitBy = 'p2';
        this.server = 'p2';
        this.updateHUD();
        return;
      }
      if (this.drillType === 'header') {
        this.ball.reset(380, 200);
        this.ball.inPlay = true;
        this.ball.vx = 1.0;
        this.ball.vy = -8.0;
        this.ball.lastHitBy = 'p1';
        this.server = 'p1';
        this.updateHUD();
        return;
      }
      if (this.drillType === 'control') {
        this.ball.reset(300, 340);
        this.ball.inPlay = true;
        this.ball.vx = 0;
        this.ball.vy = -8.5;
        this.ball.lastHitBy = 'p1';
        this.server = 'p1';
        this.updateHUD();
        return;
      }

      const serveX = server === 'p1' ? 240 : 960;
      const serveY = 380;
      this.ball.reset(serveX, serveY);
      this.serveReadyTimer = 50; // Contagem antes do saque automático ou por tecla

      this.updateHUD();
    }

    executeServe() {
      if (this.ball.inPlay) return;

      this.ball.inPlay = true;
      const dir = this.server === 'p1' ? 1 : -1;
      this.ball.vx = dir * 7.8;
      this.ball.vy = -10.5;
      this.ball.spin = dir * 1.5;
      this.ball.lastHitBy = this.server;

      audio.playKick(1.1);
      particles.addHitImpact(this.ball.x, this.ball.y, false);
    }

    update() {
      // O loop principal também roda enquanto o menu está aberto. Antes do
      // início da primeira partida, os atletas ainda não foram criados.
      // Evita que uma exceção interrompa permanentemente o requestAnimationFrame.
      if (!this.p1 || !this.p2) {
        particles.update();
        return;
      }

      if (this.isPaused || this.isMatchOver) return;

      // Tremor de tela
      if (this.shakeIntensity > 0) {
        this.shakeIntensity *= 0.88;
        if (this.shakeIntensity < 0.2) this.shakeIntensity = 0;
      }

      // Preparação para Saque
      if (!this.ball.inPlay && !this.ball.groundHit) {
        if (this.serveReadyTimer > 0) {
          this.serveReadyTimer--;
          if (this.serveReadyTimer === 0) {
            this.executeServe();
          }
        }
      }

      // Pausa pós ponto
      if (this.pointPauseTimer > 0) {
        this.pointPauseTimer--;
        if (this.pointPauseTimer === 0) {
          this.prepareServe(this.server);
        }
      }

      // Atualiza Jogadores
      const netX = 600;
      this.p1.update(this.ball, netX, 80, 1120, this.inputState);
      this.p2.update(this.ball, netX, 80, 1120, this.inputState);

      // Atualiza Física da Bola
      this.ball.update(netX, 360, 180, 80, 1120, 540);

      // Verificação de Ponto (Bola tocou o chão)
      if (this.ball.groundHit && this.pointPauseTimer === 0) {
        this.handlePointScored();
      }

      // Partículas
      particles.update();
    }

    handlePointScored() {
      const netX = 600;
      const ballX = this.ball.x;
      const courtMinX = 80;
      const courtMaxX = 1120;

      let scorer = null;
      let reason = '';

      // Regras de Ponto do Futevôlei
      if (ballX < courtMinX || ballX > courtMaxX) {
        // Bola caiu fora da quadra (out)
        // O ponto vai para quem NÃO deu o último toque
        scorer = this.ball.lastHitBy === 'p1' ? 'p2' : 'p1';
        reason = 'BOLA FORA!';
      } else {
        // Bola caiu dentro da quadra
        if (ballX < netX) {
          // Caiu no campo do P1 -> Ponto da CPU
          scorer = 'p2';
          reason = 'PONTO DO ADVERSÁRIO!';
        } else {
          // Caiu no campo da CPU -> Ponto do P1!
          scorer = 'p1';
          reason = 'GOLAÇO NA AREIA!';
        }
      }

      if (scorer === 'p1') {
        this.scoreP1++;
        this.server = 'p1';
        audio.playCrowdCheer();
        audio.playWhistle(true);
        showPointNotification('PONTO!', `${this.p1.cfg.name} MARCOU!`);
        triggerScreenShake(8);

        saveSys.data.stats.pointsScored++;
        saveSys.unlockAchievement('first_point');

        if (this.p1.touchCount === 1 && this.rallyHits === 0) {
          this.stats.aces++;
          saveSys.data.stats.aces++;
        }
      } else {
        this.scoreP2++;
        this.server = 'p2';
        audio.playWhistle(true);
        showPointNotification('PONTO!', `${this.p2.cfg.name} MARCOU!`);
      }

      this.updateHUD();
      this.pointPauseTimer = 90; // Pausa para comemoração

      // Checa Fim de Partida
      if (this.scoreP1 >= this.targetScore || this.scoreP2 >= this.targetScore) {
        this.finishMatch();
      }
    }

    finishMatch() {
      this.isMatchOver = true;
      const p1Won = this.scoreP1 >= this.targetScore;

      if (p1Won) {
        audio.playVictory();
        particles.addConfettiBurst(600, 300, 90);
        saveSys.data.stats.wins++;
        saveSys.unlockAchievement('first_win');
        if (this.p2.aiDifficulty === 'legend') {
          saveSys.unlockAchievement('legend_killer');
        }
      } else {
        audio.playDefeat();
        saveSys.data.stats.losses++;
      }

      saveSys.data.stats.matches++;
      saveSys.save();

      setTimeout(() => {
        showMatchResultModal(p1Won, this.scoreP1, this.scoreP2, this.stats, this.matchMode);
      }, 1600);
    }

    updateHUD() {
      document.getElementById('p1-score-display').innerText = this.scoreP1;
      document.getElementById('p2-score-display').innerText = this.scoreP2;

      document.getElementById('p1-touches').innerText = `Toques: ${this.p1.touchCount}/3`;
      document.getElementById('p2-touches').innerText = `Toques: ${this.p2.touchCount}/3`;

      document.getElementById('p1-energy-bar').style.width = `${this.p1.energy}%`;
      document.getElementById('p2-energy-bar').style.width = `${this.p2.energy}%`;

      const p1Badge = document.getElementById('p1-serve-badge');
      const p2Badge = document.getElementById('p2-serve-badge');
      if (this.server === 'p1') {
        p1Badge.classList.add('active');
        p2Badge.classList.remove('active');
      } else {
        p2Badge.classList.add('active');
        p1Badge.classList.remove('active');
      }
    }

    render() {
      const w = this.canvas.width;
      const h = this.canvas.height;

      this.ctx.save();

      // Efeito de Tremor de Câmera
      if (this.shakeIntensity > 0) {
        const shakeX = (Math.random() - 0.5) * this.shakeIntensity;
        const shakeY = (Math.random() - 0.5) * this.shakeIntensity;
        this.ctx.translate(shakeX, shakeY);
      }

      // Renderiza Arena e Quadra
      this.court.render(this.ctx, w, h, this.currentArenaId, this.scoreP1 > this.scoreP2);

      // Renderiza Jogadores
      if (this.p1) this.p1.render(this.ctx);
      if (this.p2) this.p2.render(this.ctx);

      // Renderiza Bola
      this.ball.render(this.ctx, 540);

      // Renderiza Partículas e Efeitos
      particles.render(this.ctx);

      this.ctx.restore();
    }

    setupWindowEvents() {
      // Evento de toque de bola para controle de rally e combos
      window.onBallContact = (player, ball) => {
        this.rallyHits++;
        if (this.rallyHits > this.maxRallyCombo) {
          this.maxRallyCombo = this.rallyHits;
          this.stats.maxCombo = this.maxRallyCombo;
          saveSys.data.stats.maxCombo = Math.max(saveSys.data.stats.maxCombo, this.maxRallyCombo);
        }

        if (this.rallyHits >= 3) {
          showComboBanner(this.rallyHits);
          if (this.rallyHits >= 5) saveSys.unlockAchievement('combo_5');
        }
      };

      // Mapeamento de Teclas
      window.addEventListener('keydown', (e) => {
        if (e.repeat) return;
        const key = e.key.toLowerCase();

        if (key === 'a' || e.key === 'ArrowLeft') this.inputState.left = true;
        if (key === 'd' || e.key === 'ArrowRight') this.inputState.right = true;
        if (key === 'w' || key === ' ' || e.key === 'ArrowUp') this.inputState.jump = true;
        if (key === 's' || e.key === 'ArrowDown') this.inputState.down = true;
        if (key === 'j') this.inputState.kick = true;
        if (key === 'k') this.inputState.header = true;
        if (key === 'l') this.inputState.special = true;
        if (key === 'e') {
          if (!this.ball.inPlay && this.server === 'p1') {
            this.executeServe();
          }
        }
        if (e.key === 'Escape') {
          togglePause();
        }
      });

      window.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        if (key === 'a' || e.key === 'ArrowLeft') this.inputState.left = false;
        if (key === 'd' || e.key === 'ArrowRight') this.inputState.right = false;
        if (key === 'w' || key === ' ' || e.key === 'ArrowUp') this.inputState.jump = false;
        if (key === 's' || e.key === 'ArrowDown') this.inputState.down = false;
        if (key === 'j') this.inputState.kick = false;
        if (key === 'k') this.inputState.header = false;
        if (key === 'l') this.inputState.special = false;
      });
    }
  }

  /* ==========================================================================
     9. GERENCIAMENTO DE INTERFACE E MENUS DO JOGO
     ========================================================================== */
  let match = null;
  let qmSelectedP1 = 'rafa';
  let qmSelectedP2 = 'leo';
  let qmSelectedDiff = 'normal';
  let qmSelectedArena = 'beach';
  let qmSelectedPoints = 12;

  function initUI() {
    const canvas = document.getElementById('game-canvas');
    resizeCanvas(canvas);
    window.addEventListener('resize', () => resizeCanvas(canvas));

    match = new MatchManager(canvas);

    updateHeaderBadges();
    initQuickMatchPickers();
    initCustomizationStore();
    initAchievementsView();
    setupTouchControls();
    setupButtonListeners();
    updateTournamentBracketUI();

    // Loop Principal de Atualização a 60FPS
    function loop() {
      match.update();
      match.render();
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  function resizeCanvas(canvas) {
    canvas.width = 1200;
    canvas.height = 675;
  }

  function switchScreen(screenId) {
    document.querySelectorAll('.screen-layer').forEach(el => {
      if (el.id !== 'match-hud' && el.id !== 'touch-controls') {
        el.classList.add('hidden');
        el.classList.remove('active');
      }
    });

    if (screenId) {
      const target = document.getElementById(screenId);
      if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
      }
    }
  }

  function updateHeaderBadges() {
    document.getElementById('user-coins-display').innerText = saveSys.data.coins;
    document.getElementById('custom-coins-display').innerText = saveSys.data.coins;
    document.getElementById('user-level-display').innerText = `NÍVEL ${saveSys.data.level}`;

    const ranks = ['Iniciante', 'Amador', 'Competidor', 'Profissional', 'Mestre', 'Lenda'];
    const rankIdx = Math.min(ranks.length - 1, Math.floor(saveSys.data.level / 5));
    document.getElementById('user-rank-display').innerText = ranks[rankIdx];

    const xpNeeded = saveSys.data.level * 180;
    const pct = Math.min(100, Math.floor((saveSys.data.xp / xpNeeded) * 100));
    document.getElementById('user-xp-fill').style.width = `${pct}%`;
  }

  function triggerScreenShake(intensity = 10) {
    if (saveSys.data.settings.screenshake && match) {
      match.shakeIntensity = intensity;
    }
  }

  function showPointNotification(title, sub) {
    const banner = document.getElementById('point-announcement');
    document.getElementById('point-title').innerText = title;
    document.getElementById('point-subtitle').innerText = sub;
    banner.classList.remove('hidden');

    clearTimeout(banner._hideTimer);
    banner._hideTimer = setTimeout(() => {
      banner.classList.add('hidden');
    }, 1700);
  }

  function showComboBanner(hits) {
    const combo = document.getElementById('combo-display');
    document.getElementById('combo-counter').innerText = `x${hits}`;
    combo.classList.remove('hidden');

    clearTimeout(combo._timer);
    combo._timer = setTimeout(() => {
      combo.classList.add('hidden');
    }, 2200);
  }

  function hideComboBanner() {
    document.getElementById('combo-display').classList.add('hidden');
  }

  function togglePause() {
    if (!match.p1 || match.isMatchOver) return;
    match.isPaused = !match.isPaused;
    const pauseScreen = document.getElementById('screen-pause');
    if (match.isPaused) {
      pauseScreen.classList.remove('hidden');
    } else {
      pauseScreen.classList.add('hidden');
    }
  }

  /* ==========================================================================
     10. SELETORES E TELAS ESPECÍFICAS
     ========================================================================== */
  function initQuickMatchPickers() {
    const p1Container = document.getElementById('qm-char-picker');
    const cpuContainer = document.getElementById('qm-cpu-picker');
    p1Container.innerHTML = '';
    cpuContainer.innerHTML = '';

    ATHLETES.forEach(ath => {
      // Miniatura para P1
      const thumb1 = document.createElement('div');
      thumb1.className = `char-thumb ${ath.id === qmSelectedP1 ? 'active' : ''}`;
      thumb1.innerHTML = `<div class="char-thumb-avatar">${ath.avatarChar}</div><div class="char-thumb-name">${ath.name}</div>`;
      thumb1.onclick = () => {
        audio.playClick();
        qmSelectedP1 = ath.id;
        document.querySelectorAll('#qm-char-picker .char-thumb').forEach(el => el.classList.remove('active'));
        thumb1.classList.add('active');
        renderAthletePreview('canvas-preview-p1', ath);
        document.getElementById('qm-p1-name').innerText = ath.name;
        document.getElementById('qm-p1-nickname').innerText = `"${ath.nickname}"`;
      };
      p1Container.appendChild(thumb1);

      // Miniatura para CPU
      const thumb2 = document.createElement('div');
      thumb2.className = `char-thumb ${ath.id === qmSelectedP2 ? 'active' : ''}`;
      thumb2.innerHTML = `<div class="char-thumb-avatar">${ath.avatarChar}</div><div class="char-thumb-name">${ath.name}</div>`;
      thumb2.onclick = () => {
        audio.playClick();
        qmSelectedP2 = ath.id;
        document.querySelectorAll('#qm-cpu-picker .char-thumb').forEach(el => el.classList.remove('active'));
        thumb2.classList.add('active');
        renderAthletePreview('canvas-preview-p2', ath);
        document.getElementById('qm-p2-name').innerText = ath.name;
        document.getElementById('qm-p2-nickname').innerText = `"${ath.nickname}"`;
      };
      cpuContainer.appendChild(thumb2);
    });

    renderAthletePreview('canvas-preview-p1', ATHLETES[0]);
    renderAthletePreview('canvas-preview-p2', ATHLETES[1]);

    // Dificuldade
    document.querySelectorAll('#qm-difficulty-selector .seg-btn').forEach(btn => {
      btn.onclick = () => {
        audio.playClick();
        document.querySelectorAll('#qm-difficulty-selector .seg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        qmSelectedDiff = btn.dataset.diff;
      };
    });

    // Arenas
    document.querySelectorAll('#qm-arena-picker .arena-card').forEach(card => {
      card.onclick = () => {
        audio.playClick();
        document.querySelectorAll('#qm-arena-picker .arena-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        qmSelectedArena = card.dataset.arena;
      };
    });

    // Pontos
    document.querySelectorAll('#qm-points-selector .seg-btn').forEach(btn => {
      btn.onclick = () => {
        audio.playClick();
        document.querySelectorAll('#qm-points-selector .seg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        qmSelectedPoints = parseInt(btn.dataset.points, 10);
      };
    });
  }

  function renderAthletePreview(canvasId, athlete) {
    const cvs = document.getElementById(canvasId);
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    ctx.clearRect(0, 0, cvs.width, cvs.height);

    ctx.save();
    ctx.translate(cvs.width / 2, cvs.height - 35);
    ctx.scale(1.2, 1.2);

    // Bermuda
    ctx.fillStyle = athlete.shortsColor;
    ctx.beginPath();
    ctx.roundRect(-14, -46, 28, 20, [4, 4, 2, 2]);
    ctx.fill();

    // Pernas
    ctx.fillStyle = athlete.skinTone;
    ctx.fillRect(-10, -26, 7, 26);
    ctx.fillRect(3, -26, 7, 26);

    // Tronco
    ctx.fillStyle = athlete.jerseyColor;
    ctx.beginPath();
    ctx.roundRect(-12, -74, 24, 30, [6, 6, 2, 2]);
    ctx.fill();

    // Cabeça
    ctx.fillStyle = athlete.skinTone;
    ctx.beginPath();
    ctx.arc(0, -84, 11, 0, Math.PI * 2);
    ctx.fill();

    // Cabelo
    ctx.fillStyle = athlete.hairColor;
    ctx.beginPath();
    ctx.arc(0, -88, 11, Math.PI, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function initCustomizationStore() {
    renderAthletePreview('canvas-custom-preview', ATHLETES[0]);

    const tabs = document.querySelectorAll('.custom-tabs-nav .tab-btn');
    tabs.forEach(tab => {
      tab.onclick = () => {
        audio.playClick();
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderCustomItems(tab.dataset.tab);
      };
    });

    renderCustomItems('shirts');
  }

  function renderCustomItems(category) {
    const container = document.getElementById('custom-items-container');
    container.innerHTML = '';
    const items = CUSTOM_ITEMS[category] || [];

    items.forEach(item => {
      const isEquipped = saveSys.data.equipped[category.slice(0, -1)] === item.id ||
                         saveSys.data.equipped[category] === item.id;
      const isUnlocked = item.unlocked || saveSys.data.unlockedItems[category]?.includes(item.id);

      const card = document.createElement('div');
      card.className = `custom-item-card ${isEquipped ? 'equipped' : ''}`;

      let swatchContent = '';
      if (item.color) {
        swatchContent = `<div class="item-swatch" style="background: ${item.color}"></div>`;
      } else if (item.primary) {
        swatchContent = `<div class="item-swatch" style="background: linear-gradient(135deg, ${item.primary}, ${item.secondary})">⚽</div>`;
      } else {
        swatchContent = `<div class="item-swatch" style="background: rgba(255,255,255,0.1)">✨</div>`;
      }

      let statusHtml = '';
      if (isEquipped) {
        statusHtml = `<span class="item-status equipped-label">EQUIPADO</span>`;
      } else if (isUnlocked) {
        statusHtml = `<span class="item-status owned-label">EQUIPAR</span>`;
      } else {
        statusHtml = `<span class="item-status price-label">🟡 ${item.price}</span>`;
      }

      card.innerHTML = `
        ${swatchContent}
        <div class="item-title">${item.name}</div>
        ${statusHtml}
      `;

      card.onclick = () => {
        audio.playClick();
        if (isUnlocked) {
          // Equipar
          const catKey = category.endsWith('s') ? category.slice(0, -1) : category;
          saveSys.data.equipped[catKey] = item.id;
          saveSys.save();
          renderCustomItems(category);
          renderAthletePreview('canvas-custom-preview', ATHLETES[0]);
        } else {
          // Comprar com Areia Coins
          if (saveSys.data.coins >= item.price) {
            saveSys.data.coins -= item.price;
            if (!saveSys.data.unlockedItems[category]) saveSys.data.unlockedItems[category] = [];
            saveSys.data.unlockedItems[category].push(item.id);
            saveSys.save();
            updateHeaderBadges();
            renderCustomItems(category);
          } else {
            showPointNotification('MOEDAS INSUFICIENTES', 'Ganhe partidas para obter Areia Coins!');
          }
        }
      };

      container.appendChild(card);
    });
  }

  function initAchievementsView() {
    const container = document.getElementById('achievements-container');
    container.innerHTML = '';

    ACHIEVEMENTS_LIST.forEach(ach => {
      const isUnlocked = saveSys.data.achievements.includes(ach.id);
      const card = document.createElement('div');
      card.className = `achievement-card ${isUnlocked ? 'unlocked' : ''}`;
      card.innerHTML = `
        <div class="ach-icon">${ach.icon}</div>
        <div class="ach-info">
          <h4>${ach.title}</h4>
          <p>${ach.desc}</p>
          <div class="ach-reward">RECOMPENSA: +${ach.reward} COINS</div>
        </div>
      `;
      container.appendChild(card);
    });
  }

  function updateTournamentBracketUI() {
    const t = saveSys.data.tournament;
    const stage = t.stage || 0;
    const p1Ath = ATHLETES.find(a => a.id === saveSys.data.equipped.athleteId) || ATHLETES[0];

    document.getElementById('b-qf1-p1').innerText = `${p1Ath.name} (VOCÊ)`;
    document.getElementById('b-qf1-p2').innerText = 'BRUNO';
    document.getElementById('b-qf2-p1').innerText = 'KAI';
    document.getElementById('b-qf2-p2').innerText = 'MIGUEL';
    document.getElementById('b-qf2-s1').innerText = '12';
    document.getElementById('b-qf2-s2').innerText = '9';

    if (t.scores.qf) {
      const parts = t.scores.qf.split(' x ');
      document.getElementById('b-qf1-s1').innerText = parts[0] || '12';
      document.getElementById('b-qf1-s2').innerText = parts[1] || '8';
      document.getElementById('b-sf1-p1').innerText = `${p1Ath.name} (VOCÊ)`;
      document.getElementById('b-sf1-p2').innerText = 'KAI';
    } else {
      document.getElementById('b-qf1-s1').innerText = '-';
      document.getElementById('b-qf1-s2').innerText = '-';
      document.getElementById('b-sf1-p1').innerText = 'VENCEDOR QF1';
      document.getElementById('b-sf1-p2').innerText = 'KAI';
    }

    if (t.scores.sf) {
      const parts = t.scores.sf.split(' x ');
      document.getElementById('b-sf1-s1').innerText = parts[0] || '12';
      document.getElementById('b-sf1-s2').innerText = parts[1] || '10';
      document.getElementById('b-fn-p1').innerText = `${p1Ath.name} (VOCÊ)`;
      document.getElementById('b-fn-p2').innerText = 'DAVI (LENDA)';
    } else {
      document.getElementById('b-sf1-s1').innerText = '-';
      document.getElementById('b-sf1-s2').innerText = '-';
      document.getElementById('b-fn-p1').innerText = 'FINALISTA 1';
      document.getElementById('b-fn-p2').innerText = 'DAVI (LENDA)';
    }

    if (t.scores.final) {
      const parts = t.scores.final.split(' x ');
      document.getElementById('b-fn-s1').innerText = parts[0] || '12';
      document.getElementById('b-fn-s2').innerText = parts[1] || '11';
    } else {
      document.getElementById('b-fn-s1').innerText = '-';
      document.getElementById('b-fn-s2').innerText = '-';
    }

    const titleEl = document.getElementById('tournament-stage-title');
    const descEl = document.getElementById('tournament-stage-desc');
    const diffEl = document.getElementById('tournament-diff-label');
    const btnPlay = document.getElementById('btn-tournament-play-match');

    if (stage === 0) {
      titleEl.innerText = 'PRÓXIMO CONFRONTO: QUARTAS';
      descEl.innerText = 'Vença Bruno para se classificar para as semifinais!';
      diffEl.innerText = 'NORMAL';
      btnPlay.innerText = 'DISPUTAR QUARTAS ➔';
      btnPlay.disabled = false;
    } else if (stage === 1) {
      titleEl.innerText = 'PRÓXIMO CONFRONTO: SEMIFINAL';
      descEl.innerText = 'Vença Kai, o mestre do Shark Attack, para chegar à Final!';
      diffEl.innerText = 'DIFÍCIL';
      btnPlay.innerText = 'DISPUTAR SEMIFINAL ➔';
      btnPlay.disabled = false;
    } else if (stage === 2) {
      titleEl.innerText = 'GRANDE FINAL DA AREIA';
      descEl.innerText = 'Enfrente Davi, o lendário Rei do Rio, pelo título nacional!';
      diffEl.innerText = 'LENDA';
      btnPlay.innerText = 'DISPUTAR A GRANDE FINAL ➔';
      btnPlay.disabled = false;
    } else {
      titleEl.innerText = '🏆 CAMPEÃO NACIONAL DE AREIA!';
      descEl.innerText = 'Você conquistou o título máximo e desbloqueou Davi!';
      diffEl.innerText = 'CONCLUÍDO';
      btnPlay.innerText = 'CAMPEONATO VENCIDO!';
      btnPlay.disabled = true;
    }
  }

  function showMatchResultModal(won, s1, s2, stats, mode) {
    const banner = document.getElementById('result-status-banner');
    const title = document.getElementById('result-title-text');
    const sub = document.getElementById('result-sub-text');

    if (won) {
      banner.style.background = 'linear-gradient(180deg, rgba(57, 255, 20, 0.3) 0%, rgba(0,0,0,0) 100%)';
      title.innerText = 'VITÓRIA ÉPICA!';
      title.style.color = '#39ff14';
      sub.innerText = 'Você dominou a quadra de futevôlei com maestria!';
    } else {
      banner.style.background = 'linear-gradient(180deg, rgba(255, 0, 110, 0.3) 0%, rgba(0,0,0,0) 100%)';
      title.innerText = 'DERROTA NA AREIA';
      title.style.color = '#ff006e';
      sub.innerText = 'Treine mais fundamentos para dar a volta por cima!';
    }

    document.getElementById('res-p1-name').innerText = match.p1.cfg.name;
    document.getElementById('res-p2-name').innerText = match.p2.cfg.name;
    document.getElementById('res-p1-score').innerText = s1;
    document.getElementById('res-p2-score').innerText = s2;

    document.getElementById('res-stat-aces').innerText = stats.aces;
    document.getElementById('res-stat-smashes').innerText = stats.smashes;
    document.getElementById('res-stat-defenses').innerText = stats.defenses;
    document.getElementById('res-stat-combo').innerText = `${stats.maxCombo}x`;

    const coinsEarned = won ? 300 + stats.smashes * 30 : 80;
    const xpEarned = won ? 220 : 70;

    saveSys.addCoins(coinsEarned);
    saveSys.addXP(xpEarned);

    document.getElementById('res-coins-earned').innerText = `+${coinsEarned}`;
    document.getElementById('res-xp-earned').innerText = `+${xpEarned} XP`;

    // Tratamento específico de Campeonato e botão Próxima Rodada
    const btnTourNext = document.getElementById('btn-result-tournament-next');
    if (mode === 'tournament') {
      if (won) {
        btnTourNext.style.display = 'inline-block';
        const curStage = saveSys.data.tournament.stage || 0;
        if (curStage === 0) {
          saveSys.data.tournament.stage = 1;
          saveSys.data.tournament.scores.qf = `${s1} x ${s2}`;
        } else if (curStage === 1) {
          saveSys.data.tournament.stage = 2;
          saveSys.data.tournament.scores.sf = `${s1} x ${s2}`;
        } else if (curStage === 2) {
          saveSys.data.tournament.stage = 3;
          saveSys.data.tournament.scores.final = `${s1} x ${s2}`;
          saveSys.addCoins(2000);
          saveSys.unlockAchievement('tournament_champ');
          if (!saveSys.data.unlockedAthletes.includes('davi')) {
            saveSys.data.unlockedAthletes.push('davi');
          }
          showPointNotification('👑 CAMPEÃO BRASILEIRO!', 'Você ergueu o Troféu de Ouro e desbloqueou Davi!');
        }
        saveSys.save();
        updateTournamentBracketUI();

        btnTourNext.onclick = () => {
          audio.playClick();
          if (saveSys.data.tournament.stage >= 3) {
            switchScreen('screen-tournament');
          } else {
            document.getElementById('btn-tournament-play-match').click();
          }
        };
      } else {
        btnTourNext.style.display = 'none';
      }
    } else {
      btnTourNext.style.display = 'none';
    }

    document.getElementById('match-hud').classList.add('hidden');
    switchScreen('screen-match-result');
  }

  function setupTouchControls() {
    const touchLayer = document.getElementById('touch-controls');
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || saveSys.data.settings.forceTouch;

    if (isTouch) {
      touchLayer.classList.remove('hidden');
    }

    const bindTouchBtn = (id, key) => {
      const btn = document.getElementById(id);
      if (!btn) return;

      const press = (e) => {
        e.preventDefault();
        audio.ensureContext();
        match.inputState[key] = true;
      };
      const release = (e) => {
        e.preventDefault();
        match.inputState[key] = false;
      };

      btn.addEventListener('touchstart', press, { passive: false });
      btn.addEventListener('touchend', release, { passive: false });
      btn.addEventListener('mousedown', press);
      btn.addEventListener('mouseup', release);
    };

    bindTouchBtn('btn-touch-left', 'left');
    bindTouchBtn('btn-touch-right', 'right');
    bindTouchBtn('btn-touch-up', 'jump');
    bindTouchBtn('btn-touch-jump', 'jump');
    bindTouchBtn('btn-touch-kick', 'kick');
    bindTouchBtn('btn-touch-header', 'header');
    bindTouchBtn('btn-touch-special', 'special');
  }

  function setupButtonListeners() {
    // Menu Principal
    document.getElementById('btn-open-quick-match').onclick = () => {
      audio.playClick();
      switchScreen('screen-quick-match');
    };
    document.getElementById('btn-open-tournament').onclick = () => {
      audio.playClick();
      updateTournamentBracketUI();
      switchScreen('screen-tournament');
    };

    document.getElementById('btn-reset-tournament').onclick = () => {
      audio.playClick();
      saveSys.data.tournament.stage = 0;
      saveSys.data.tournament.scores = {};
      saveSys.save();
      updateTournamentBracketUI();
      showPointNotification('CAMPEONATO REINICIADO', 'A chave foi resetada para nova disputa!');
    };

    document.getElementById('btn-open-training').onclick = () => {
      audio.playClick();
      switchScreen('screen-training');
    };
    document.getElementById('btn-open-customization').onclick = () => {
      audio.playClick();
      switchScreen('screen-customization');
    };
    document.getElementById('btn-open-challenges').onclick = () => {
      audio.playClick();
      switchScreen('screen-challenges');
    };
    document.getElementById('btn-open-how-to-play').onclick = () => {
      audio.playClick();
      switchScreen('screen-how-to-play');
    };
    document.getElementById('btn-open-settings').onclick = () => {
      audio.playClick();
      switchScreen('screen-settings');
    };

    // Fechar Telas
    document.getElementById('btn-close-quick-match').onclick = () => switchScreen('screen-main-menu');
    document.getElementById('btn-close-tournament').onclick = () => switchScreen('screen-main-menu');
    document.getElementById('btn-close-training').onclick = () => switchScreen('screen-main-menu');
    document.getElementById('btn-close-customization').onclick = () => switchScreen('screen-main-menu');
    document.getElementById('btn-close-challenges').onclick = () => switchScreen('screen-main-menu');
    document.getElementById('btn-close-how-to-play').onclick = () => switchScreen('screen-main-menu');
    document.getElementById('btn-close-settings').onclick = () => switchScreen('screen-main-menu');

    // Iniciar Partida Rápida
    document.getElementById('btn-start-quick-match').onclick = () => {
      audio.playClick();
      const p1Ath = ATHLETES.find(a => a.id === qmSelectedP1) || ATHLETES[0];
      const p2Ath = ATHLETES.find(a => a.id === qmSelectedP2) || ATHLETES[1];

      switchScreen(null);
      document.getElementById('match-hud').classList.remove('hidden');
      match.startMatch(p1Ath, p2Ath, qmSelectedDiff, qmSelectedArena, qmSelectedPoints, 'quick');
    };

    // Iniciar Partida de Campeonato
    document.getElementById('btn-tournament-play-match').onclick = () => {
      audio.playClick();
      const p1Ath = ATHLETES.find(a => a.id === saveSys.data.equipped.athleteId) || ATHLETES[0];
      const stage = saveSys.data.tournament.stage || 0;
      let cpuAth = ATHLETES[3]; // Bruno
      let diff = 'normal';

      if (stage === 1) {
        cpuAth = ATHLETES[2]; // Kai
        diff = 'hard';
      } else if (stage >= 2) {
        cpuAth = ATHLETES[5]; // Davi
        diff = 'legend';
      }

      switchScreen(null);
      document.getElementById('match-hud').classList.remove('hidden');
      match.startMatch(p1Ath, cpuAth, diff, 'sunset', 12, 'tournament');
    };

    // Modos de Treino
    document.querySelectorAll('.btn-start-drill').forEach(btn => {
      btn.onclick = () => {
        audio.playClick();
        const drill = btn.dataset.drill;
        const p1Ath = ATHLETES.find(a => a.id === saveSys.data.equipped.athleteId) || ATHLETES[0];
        const p2Ath = ATHLETES[1];

        switchScreen(null);
        document.getElementById('match-hud').classList.remove('hidden');
        match.startMatch(p1Ath, p2Ath, 'easy', 'beach', 12, 'training', drill);
        showPointNotification('MODO TREINO', `Fundamento: ${drill.toUpperCase()}`);
      };
    });

    // Sons e Fullscreen
    document.getElementById('btn-toggle-sound').onclick = (e) => {
      audio.ensureContext();
      audio.setMuted(!audio.muted);
      e.target.innerText = audio.muted ? '🔇' : '🔊';
    };

    document.getElementById('btn-fullscreen').onclick = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    };

    // Pausa
    document.getElementById('btn-quick-pause').onclick = () => togglePause();
    document.getElementById('btn-pause-resume').onclick = () => togglePause();
    document.getElementById('btn-pause-restart').onclick = () => {
      togglePause();
      match.startMatch(match.p1.cfg, match.p2.cfg, match.p2.aiDifficulty, match.currentArenaId, match.targetScore, match.matchMode);
    };
    document.getElementById('btn-pause-how-to-play').onclick = () => {
      switchScreen('screen-how-to-play');
    };
    document.getElementById('btn-pause-quit').onclick = () => {
      togglePause();
      document.getElementById('match-hud').classList.add('hidden');
      switchScreen('screen-main-menu');
    };

    // Tela de Resultado
    document.getElementById('btn-result-menu').onclick = () => {
      audio.playClick();
      switchScreen('screen-main-menu');
    };
    document.getElementById('btn-result-rematch').onclick = () => {
      audio.playClick();
      switchScreen(null);
      document.getElementById('match-hud').classList.remove('hidden');
      match.startMatch(match.p1.cfg, match.p2.cfg, match.p2.aiDifficulty, match.currentArenaId, match.targetScore, match.matchMode);
    };

    // Configurações
    document.getElementById('set-sfx-volume').oninput = (e) => {
      const val = parseInt(e.target.value, 10);
      document.getElementById('sfx-vol-val').innerText = `${val}%`;
      audio.setSFXVolume(val / 100);
      saveSys.data.settings.sfxVolume = val;
    };
    document.getElementById('set-ambient-volume').oninput = (e) => {
      const val = parseInt(e.target.value, 10);
      document.getElementById('amb-vol-val').innerText = `${val}%`;
      audio.setAmbientVolume(val / 100);
      saveSys.data.settings.ambientVolume = val;
    };
    document.getElementById('set-screenshake').onchange = (e) => {
      saveSys.data.settings.screenshake = e.target.checked;
    };
    document.getElementById('btn-save-settings').onclick = () => {
      audio.playClick();
      saveSys.save();
      showPointNotification('CONFIGURAÇÕES SALVAS', 'Preferências gravadas com sucesso!');
      switchScreen('screen-main-menu');
    };
    document.getElementById('btn-reset-save').onclick = () => {
      if (confirm('Tem certeza que deseja resetar todo o seu progresso? Essa ação não pode ser desfeita.')) {
        saveSys.resetAll();
      }
    };
  }

  // Inicialização quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUI);
  } else {
    initUI();
  }

})();
