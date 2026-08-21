/**
 * VantagePulse AI™ - SaaS Landing Interactive Animated Particle & Cyber Synapse Engine
 * High-performance 60fps HTML5 Canvas background particle system with interactive cursor physics,
 * synaptic data pulses, and theme-adaptive luminescent colors.
 */

class LandingBackgroundAnimation {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.dataPackets = [];
    this.animationFrameId = null;
    this.isRunning = false;
    this.maxParticles = 75;
    this.connectDistance = 140;
    this.mouse = { x: -1000, y: -1000, radius: 160 };

    this.init();
  }

  init() {
    this.canvas = document.getElementById('landing-bg-canvas');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.resize();

    window.addEventListener('resize', () => this.resize(), { passive: true });

    // Track mouse on landing hero
    const hero = document.querySelector('.hero-section') || document.getElementById('view-landing');
    if (hero) {
      hero.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
      }, { passive: true });

      hero.addEventListener('mouseleave', () => {
        this.mouse.x = -1000;
        this.mouse.y = -1000;
      }, { passive: true });
    }

    this.createParticles();
    this.start();
  }

  resize() {
    if (!this.canvas) return;
    const hero = document.querySelector('.hero-section');
    const width = hero ? hero.offsetWidth : window.innerWidth;
    const height = hero ? hero.offsetHeight : 850;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.ctx.scale(dpr, dpr);
    this.width = width;
    this.height = height;

    // Adjust particle density
    this.maxParticles = Math.max(35, Math.min(85, Math.floor((width * height) / 12000)));
    if (this.particles.length > 0) {
      this.createParticles();
    }
  }

  getThemeColors() {
    const theme = document.documentElement.getAttribute('data-theme') || 'midnight';
    if (theme === 'light') {
      return {
        particle: 'rgba(0, 120, 212, ',
        line: 'rgba(0, 120, 212, ',
        glow: 'rgba(0, 164, 239, 0.4)',
        packet: '#0078d4'
      };
    } else if (theme === 'onyx') {
      return {
        particle: 'rgba(168, 85, 247, ',
        line: 'rgba(168, 85, 247, ',
        glow: 'rgba(236, 72, 153, 0.5)',
        packet: '#c084fc'
      };
    } else if (theme === 'azure') {
      return {
        particle: 'rgba(0, 164, 239, ',
        line: 'rgba(0, 120, 212, ',
        glow: 'rgba(56, 189, 248, 0.6)',
        packet: '#38bdf8'
      };
    } else {
      // Midnight Cyber
      return {
        particle: 'rgba(56, 189, 248, ',
        line: 'rgba(99, 102, 241, ',
        glow: 'rgba(56, 189, 248, 0.5)',
        packet: '#38bdf8'
      };
    }
  }

  createParticles() {
    this.particles = [];
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.75,
        vy: (Math.random() - 0.5) * 0.75,
        radius: Math.random() * 2.2 + 1.2,
        alpha: Math.random() * 0.55 + 0.25,
        baseAlpha: Math.random() * 0.55 + 0.25,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        pulseVal: Math.random() * Math.PI * 2
      });
    }
    this.dataPackets = [];
  }

  spawnDataPacket(p1, p2) {
    if (this.dataPackets.length >= 12) return;
    this.dataPackets.push({
      x1: p1.x,
      y1: p1.y,
      x2: p2.x,
      y2: p2.y,
      progress: 0,
      speed: Math.random() * 0.02 + 0.012,
      size: Math.random() * 2.5 + 2
    });
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.loop();
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  loop() {
    if (!this.isRunning) return;

    this.update();
    this.render();

    this.animationFrameId = requestAnimationFrame(() => this.loop());
  }

  update() {
    const colors = this.getThemeColors();

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Update positions
      p.x += p.vx;
      p.y += p.vy;

      // Pulse alpha smoothly
      p.pulseVal += p.pulseSpeed;
      p.alpha = p.baseAlpha + Math.sin(p.pulseVal) * 0.2;

      // Bounce on screen edges
      if (p.x < 0 || p.x > this.width) p.vx *= -1;
      if (p.y < 0 || p.y > this.height) p.vy *= -1;

      // Cursor interaction (repel gently)
      const dx = this.mouse.x - p.x;
      const dy = this.mouse.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.mouse.radius && dist > 0) {
        const force = (1 - dist / this.mouse.radius) * 1.5;
        p.x -= (dx / dist) * force;
        p.y -= (dy / dist) * force;
        p.alpha = Math.min(1, p.alpha + 0.35);
      }
    }

    // Update telemetry data packets
    for (let k = this.dataPackets.length - 1; k >= 0; k--) {
      const packet = this.dataPackets[k];
      packet.progress += packet.speed;
      if (packet.progress >= 1) {
        this.dataPackets.splice(k, 1);
      }
    }

    // Randomly spawn data packet on connections
    if (Math.random() < 0.06 && this.particles.length > 2) {
      const p1 = this.particles[Math.floor(Math.random() * this.particles.length)];
      for (let j = 0; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const d = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        if (d > 30 && d < this.connectDistance) {
          this.spawnDataPacket(p1, p2);
          break;
        }
      }
    }
  }

  render() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.width, this.height);

    const colors = this.getThemeColors();

    // 1. Draw Synaptic Connecting Lines
    for (let i = 0; i < this.particles.length; i++) {
      const p1 = this.particles[i];
      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.connectDistance) {
          const lineAlpha = (1 - dist / this.connectDistance) * 0.28;
          this.ctx.beginPath();
          this.ctx.strokeStyle = `${colors.line}${lineAlpha})`;
          this.ctx.lineWidth = 1;
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.stroke();
        }
      }
    }

    // 2. Draw Data Packets along Synapses
    for (let k = 0; k < this.dataPackets.length; k++) {
      const pkt = this.dataPackets[k];
      const curX = pkt.x1 + (pkt.x2 - pkt.x1) * pkt.progress;
      const curY = pkt.y1 + (pkt.y2 - pkt.y1) * pkt.progress;

      this.ctx.beginPath();
      this.ctx.arc(curX, curY, pkt.size, 0, Math.PI * 2);
      this.ctx.fillStyle = colors.packet;
      this.ctx.shadowColor = colors.glow;
      this.ctx.shadowBlur = 10;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }

    // 3. Draw Constellation Particle Nodes
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `${colors.particle}${Math.max(0.1, Math.min(1, p.alpha))})`;
      this.ctx.shadowColor = colors.glow;
      this.ctx.shadowBlur = 6;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }
  }
}

// Global Landing Animation Instance
window.landingAnimation = new LandingBackgroundAnimation();
