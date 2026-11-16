tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            stardew: {
              woodLight: '#e69d52',
              woodDark: '#935327',
              woodBorder: '#4a2505',
              nightBg: '#1b1c30',
              nightPanel: '#2c223b',
              dayBg: '#70b9f0',
              dayPanel: '#ffebc2',
              gold: '#fcc200',
              greenBar: '#4caf50',
            }
          },
          fontFamily: {
            pixel: ['"Press Start 2P"', 'monospace'],
            vt: ['VT323', 'monospace']
          }
        }
      }
    }

   class FarmChiptunePlayer {
  constructor() {
    this.audioCtx = null;
    this.isPlaying = false;
    this.stepIndex = 0;
    this.timerId = null;
    this.lastThemeWasNight = null;

    this.notes = {
      C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23,
      G4: 392.00, A4: 440.00, B4: 493.88,
      C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99,
      REST: 0
    };

    // Melodia de Dia: alegre, brilhante e pastoral
    this.dayMelody = [
      { note: 'C5', duration: 0.35 }, { note: 'G4', duration: 0.35 },
      { note: 'E4', duration: 0.35 }, { note: 'G4', duration: 0.35 },
      { note: 'A4', duration: 0.35 }, { note: 'C5', duration: 0.35 },
      { note: 'B4', duration: 0.35 }, { note: 'G4', duration: 0.35 },
      { note: 'F4', duration: 0.35 }, { note: 'A4', duration: 0.35 },
      { note: 'G4', duration: 0.35 }, { note: 'E4', duration: 0.35 },
      { note: 'D4', duration: 0.35 }, { note: 'F4', duration: 0.35 },
      { note: 'E4', duration: 0.70 }, { note: 'REST', duration: 0.35 }
    ];

    // Melodia de Noite: bem mais lenta, grave e calma (canção de ninar)
    this.nightMelody = [
      { note: 'E4', duration: 0.7 }, { note: 'G4', duration: 0.7 },
      { note: 'B4', duration: 0.9 }, { note: 'A4', duration: 0.7 },
      { note: 'G4', duration: 0.7 }, { note: 'E4', duration: 0.9 },
      { note: 'D4', duration: 0.7 }, { note: 'F4', duration: 0.7 },
      { note: 'A4', duration: 0.9 }, { note: 'G4', duration: 0.7 },
      { note: 'E4', duration: 1.1 }, { note: 'REST', duration: 0.7 }
    ];

    this.watchThemeChanges();
  }

  initContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  isNightMode() {
    const html = document.documentElement;
    const body = document.body;

    // Verifica atributos data-theme no html ou body
    const htmlTheme = html.getAttribute('data-theme');
    const bodyTheme = body.getAttribute('data-theme');
    if (htmlTheme === 'dark' || htmlTheme === 'night' || bodyTheme === 'dark' || bodyTheme === 'night') {
      return true;
    }

    // Verifica as classes mais comuns de tema escuro/noite no html ou body
    const darkClasses = ['dark-theme', 'dark-mode', 'dark', 'night-theme', 'night-mode', 'night'];
    return darkClasses.some(cls => body.classList.contains(cls) || html.classList.contains(cls));
  }

  // Vigia mudanças de classe ou atributo no html/body para trocar a música na hora
  watchThemeChanges() {
    const observer = new MutationObserver(() => {
      const currentIsNight = this.isNightMode();
      if (this.isPlaying && currentIsNight !== this.lastThemeWasNight) {
        this.lastThemeWasNight = currentIsNight;
        this.stepIndex = 0; // Reinicia a melodia do novo clima do começo
        clearTimeout(this.timerId);
        this.scheduleNextNote();
      }
    });

    const config = { attributes: true, attributeFilter: ['class', 'data-theme'] };
    observer.observe(document.body, config);
    observer.observe(document.documentElement, config);
  }

  playTone(freq, duration) {
    if (!freq || !this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();
    const isNight = this.isNightMode();

    // Onda triangular de dia (brilhante) e senoidal à noite (suave)
    osc.type = isNight ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    const maxVolume = isNight ? 0.06 : 0.08;
    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.exponentialRampToValueAtTime(maxVolume, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  scheduleNextNote() {
    if (!this.isPlaying) return;

    const isNight = this.isNightMode();
    this.lastThemeWasNight = isNight;

    const currentMelody = isNight ? this.nightMelody : this.dayMelody;
    const step = currentMelody[this.stepIndex % currentMelody.length];
    const freq = this.notes[step.note];

    this.playTone(freq, step.duration * 0.9);

    this.stepIndex++;
    this.timerId = setTimeout(() => {
      this.scheduleNextNote();
    }, step.duration * 1000);
  }

  toggle() {
    this.initContext();
    this.isPlaying = !this.isPlaying;

    if (this.isPlaying) {
      this.stepIndex = 0;
      this.scheduleNextNote();
    } else {
      clearTimeout(this.timerId);
    }

    return this.isPlaying;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const player = new FarmChiptunePlayer();
  const audioBtn = document.getElementById('audio-toggle');
  const audioIcon = document.getElementById('audio-icon');
  const audioLabel = document.getElementById('audio-label');

  if (audioBtn) {
    audioBtn.addEventListener('click', () => {
      const playing = player.toggle();
      audioIcon.textContent = playing ? '🔊' : '🔇';
      audioLabel.textContent = playing ? 'Música: On' : 'Música: Off';
    });
  }
});

/* Audio Web API Synth for 8-bit Sound Effects */
    let audioEnabled = true;
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function playBeep(freq = 440, type = 'square', duration = 0.08) {
      if (!audioEnabled) return;
      try {
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
      } catch(e){}
    }

    function toggleSound() {
      audioEnabled = !audioEnabled;
      document.getElementById('sound-status').innerText = audioEnabled ? 'Som: ON' : 'Som: OFF';
      if(audioEnabled) playBeep(587, 'square', 0.1);
    }

    /* Tab Switcher Logic */
    function switchTab(tabName) {
      playBeep(523, 'square', 0.06);
      
      // Hide all sections
      ['journal', 'inventory', 'quests', 'mailbox'].forEach(id => {
        document.getElementById(`section-${id}`).classList.add('hidden');
        document.getElementById(`tab-${id}`).classList.remove('active-tab');
      });

      // Show selected section
      document.getElementById(`section-${tabName}`).classList.remove('hidden');
      document.getElementById(`tab-${tabName}`).classList.add('active-tab');
    }

    /* Inventory Items Inspection Data */
    const itemData = {
      react: {
        name: 'React.js',
        quality: 'Qualidade: Estrela de Ouro ⭐️',
        desc: 'Ferramenta lendária obtida nas profundezas das minas de componentes reativos. Aumenta a velocidade de renderização e estado.',
        icon: '<i class="devicon-react-original colored"></i>'
      },
      js: {
        name: 'JavaScript ES6+',
        quality: 'Qualidade: Estrela de Ouro ⭐️',
        desc: 'Pergaminho mágico essencial para conjurar dinamismo, rotas assíncronas e funções em toda a vila.',
        icon: '<i class="devicon-javascript-plain colored"></i>'
      },
      html: {
        name: 'HTML5 Semântico',
        quality: 'Qualidade: Estrela de Iridium 💜',
        desc: 'Tijolo de fundação inquebrável. Garante acessibilidade e estrutura sólida para todas as construções web.',
        icon: '<i class="devicon-html5-plain colored"></i>'
      },
      css: {
        name: 'CSS3 & Flexbox/Grid',
        quality: 'Qualidade: Estrela de Iridium 💜',
        desc: 'Tinta de alquimia capaz de transformar layouts brutos em interfaces estilizadas e fluidas.',
        icon: '<i class="devicon-css3-plain colored"></i>'
      },
      tailwind: {
        name: 'Tailwind CSS',
        quality: 'Qualidade: Estrela de Ouro ⭐️',
        desc: 'Elixir de agilidade visual. Permite estilização direta na velocidade da luz sem sair do código.',
        icon: '<i class="devicon-tailwindcss-original colored"></i>'
      },
      git: {
        name: 'Git & GitHub',
        quality: 'Qualidade: Normal ⚪',
        desc: 'Semente de versionamento. Permite voltar no tempo caso pragas (bugs) afetem o código.',
        icon: '<i class="devicon-git-plain colored"></i>'
      },
      ts: {
        name: 'TypeScript',
        quality: 'Qualidade: Normal ⚪',
        desc: 'Escudo de checagem de tipos que previne erros e exceções antes de entrarem em combate.',
        icon: '<i class="devicon-typescript-plain colored"></i>'
      },
      figma: {
        name: 'Figma (UI Design)',
        quality: 'Qualidade: Estrela de Ouro ⭐️',
        desc: 'Ferramenta de cartografia para desenhar mapas de telas e protótipos impecáveis.',
        icon: '<i class="devicon-figma-plain colored"></i>'
      }
    };

    function inspectItem(key) {
      playBeep(659, 'triangle', 0.08);
      const data = itemData[key];
      if (!data) return;

      document.getElementById('item-icon').innerHTML = data.icon;
      document.getElementById('item-name').innerText = data.name;
      document.getElementById('item-quality').innerText = data.quality;
      document.getElementById('item-desc').innerText = data.desc;

      const tooltip = document.getElementById('item-tooltip');
      tooltip.classList.remove('hidden');
    }

    /* Theme Switcher Logic (Day / Light vs Night / Dark) */
    let isNight = false;
    function toggleTheme() {
      isNight = !isNight;
      const html = document.documentElement;
      const icon = document.getElementById('theme-icon');
      const text = document.getElementById('theme-text');
      const hudTime = document.getElementById('hud-time');
      const hudSeason = document.getElementById('hud-season');

      if (isNight) {
        html.classList.remove('day-theme');
        html.classList.add('night-theme', 'dark');
        icon.innerText = '🌙';
        text.innerText = 'Noite';
        hudTime.innerHTML = '🌙 10:00 PM';
        hudSeason.innerHTML = '🌌 Outono, Ano 1';
        playBeep(330, 'sine', 0.15);
      } else {
        html.classList.remove('night-theme', 'dark');
        html.classList.add('day-theme');
        icon.innerText = '☀️';
        text.innerText = 'Dia';
        hudTime.innerHTML = '☀️️ 09:00 AM';
        hudSeason.innerHTML = '🌱 Primavera, Ano 1';
        playBeep(880, 'sine', 0.15);
      }
    }

    /* Contact Form & Particle Effects */
    async function sendLetter(e) {
      e.preventDefault();
      const form = e.target;
      const btn = document.getElementById('submit-letter-btn');
      const originalText = btn.innerHTML;

      btn.disabled = true;
      btn.innerHTML = '⏳ Enviando carta...';

      const formData = new FormData(form);
      formData.append('_subject', 'Nova Carta do Portfólio Stardew Valley! 🌾');
      formData.append('_captcha', 'false');

      try {
        const response = await fetch('https://formsubmit.co/ajax/nati.g.peralta@hotmail.com', {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          playBeep(784, 'square', 0.2);

          // Aumenta o EXP / Ouro no HUD
          const expCounter = document.getElementById('exp-counter');
          let currentExp = parseInt(expCounter.innerText.replace(/,/g, '').replace(/\./g, ''));
          expCounter.innerText = (currentExp + 100).toLocaleString('en-US');

          alert('📬 Carta enviada para a Caixa de Envio com sucesso! (+100g de EXP)');
          form.reset();
        } else {
          throw new Error('Falha no envio');
        }
      } catch (error) {
        alert('❌ Ops! Os Junimos se perderam no caminho. Tente novamente ou envie direto para nati.g.peralta@hotmail.com');
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
  }

    function showRewardMsg(e, msg) {
      e.preventDefault();
      playBeep(698, 'square', 0.1);
      alert(msg);
    }

    function triggerJunimoHeart(e) {
      playBeep(1046, 'sine', 0.12);
      const heart = document.createElement('div');
      heart.className = 'particle-heart';
      heart.innerText = '❤️';
      heart.style.left = `${e.clientX - 10}px`;
      heart.style.top = `${e.clientY - 20}px`;
      document.body.appendChild(heart);

      setTimeout(() => {
        heart.remove();
      }, 800);
    }

    /* Dynamic Canvas Floating Fireflies & Clouds */
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Create Canvas Floating Elements
    for(let i = 0; i < 25; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        alpha: Math.random()
      });
    }

    function animateCanvas() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.fillStyle = isNight ? `rgba(255, 255, 150, ${p.alpha})` : `rgba(255, 255, 255, ${p.alpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(animateCanvas);
    }

    window.onload = function() {
      animateCanvas();
    }