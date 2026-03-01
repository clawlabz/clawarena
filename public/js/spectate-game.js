class TribunalRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.players = [];
    this.phase = 'lobby';
    this.round = 0;
    this.speeches = [];
    this.activeSpeech = null;
    this.speechQueue = [];
    this.speechTimer = null;
    this.votes = {};
    this.winner = null;
    this.nightOverlay = 0;
    this.targetNightOverlay = 0;
    this.eliminationAnim = null;
    this.particles = [];
    this.time = 0;
    this.tableGlow = 0;

    // Colors for players
    this.playerColors = [
      '#ef4444', '#f59e0b', '#22c55e', '#3b82f6',
      '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
      '#06b6d4', '#84cc16', '#e879f9', '#fb923c'
    ];

    this.roleIcons = {
      citizen: '🛡️',
      traitor: '🗡️',
      detective: '🔍'
    };

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.startLoop();
  }

  resize() {
    const container = this.canvas.parentElement;
    const w = container.clientWidth;
    const h = container.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.scale(dpr, dpr);
    this.w = w;
    this.h = h;
    this.centerX = w / 2;
    this.centerY = h / 2 + 20;
    this.tableRadius = Math.min(w, h) * 0.28;
    this.playerRadius = this.tableRadius + 80;
  }

  startLoop() {
    const loop = () => {
      this.time += 0.016;
      this.update();
      this.draw();
      requestAnimationFrame(loop);
    };
    loop();
  }

  update() {
    // Night overlay lerp
    if (this.phase === 'night') this.targetNightOverlay = 0.5;
    else this.targetNightOverlay = 0;
    this.nightOverlay += (this.targetNightOverlay - this.nightOverlay) * 0.05;

    // Table glow
    this.tableGlow = 0.5 + Math.sin(this.time * 2) * 0.3;

    // Particles
    if (Math.random() < 0.05) {
      this.particles.push({
        x: Math.random() * this.w,
        y: this.h + 10,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -0.5 - Math.random() * 1,
        life: 1,
        size: 1 + Math.random() * 2,
        color: this.phase === 'night' ? '#3b82f6' : '#dc2626'
      });
    }
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.005;
      return p.life > 0;
    });

    // Elimination animation
    if (this.eliminationAnim) {
      this.eliminationAnim.progress += 0.02;
      if (this.eliminationAnim.progress >= 1) this.eliminationAnim = null;
    }
  }

  draw() {
    const ctx = this.ctx;
    const w = this.w;
    const h = this.h;

    // Background
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, w, h);

    // Background grid
    ctx.strokeStyle = 'rgba(220,38,38,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Particles
    for (const p of this.particles) {
      ctx.globalAlpha = p.life * 0.5;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Table
    this.drawTable();

    // Players
    this.drawPlayers();

    // Active speech bubble
    if (this.activeSpeech) {
      this.drawSpeechBubble(this.activeSpeech);
    }

    // Night overlay
    if (this.nightOverlay > 0.01) {
      ctx.fillStyle = `rgba(5,5,20,${this.nightOverlay})`;
      ctx.fillRect(0, 0, w, h);

      // Moon
      if (this.nightOverlay > 0.2) {
        ctx.fillStyle = `rgba(200,200,255,${this.nightOverlay * 0.5})`;
        ctx.beginPath();
        ctx.arc(w - 80, 60, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0a0a0f';
        ctx.beginPath();
        ctx.arc(w - 70, 55, 22, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Phase indicator
    this.drawPhaseIndicator();

    // Winner overlay
    if (this.winner) {
      this.drawWinnerOverlay();
    }

    // Round info
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Round ${this.round} • ${this.players.filter(p => p.alive).length} alive`, 15, h - 15);
  }

  drawTable() {
    const ctx = this.ctx;
    const cx = this.centerX;
    const cy = this.centerY;
    const r = this.tableRadius;

    // Table shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 10, r + 5, r * 0.55 + 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Table surface
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, '#2a1a1a');
    grad.addColorStop(0.7, '#1a1215');
    grad.addColorStop(1, '#120a0e');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    // Table border glow
    ctx.strokeStyle = `rgba(220,38,38,${0.2 + this.tableGlow * 0.15})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * 0.55, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Inner ring
    ctx.strokeStyle = `rgba(220,38,38,${0.08 + this.tableGlow * 0.05})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 0.6, r * 0.33, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Center emblem
    ctx.fillStyle = `rgba(220,38,38,${0.1 + this.tableGlow * 0.08})`;
    ctx.font = `${Math.floor(r * 0.3)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚖️', cx, cy);
  }

  drawPlayers() {
    const count = this.players.length;
    if (count === 0) return;

    for (let i = 0; i < count; i++) {
      const player = this.players[i];
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      const x = this.centerX + Math.cos(angle) * this.playerRadius;
      const y = this.centerY + Math.sin(angle) * this.playerRadius * 0.55;

      player._x = x;
      player._y = y;

      this.drawPlayer(player, x, y, i);
    }
  }

  drawPlayer(player, x, y, index) {
    const ctx = this.ctx;
    const size = 28;
    const color = this.playerColors[index % this.playerColors.length];
    const isAlive = player.alive;
    const isSpeaking = this.activeSpeech && this.activeSpeech.playerId === player.id;

    ctx.save();

    if (!isAlive) {
      ctx.globalAlpha = 0.25;
    }

    // Speaking glow
    if (isSpeaking) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 20;
    }

    // Body (pixel-style character)
    const px = Math.floor(x - size / 2);
    const py = Math.floor(y - size / 2);
    const u = Math.floor(size / 8); // pixel unit

    // Head
    ctx.fillStyle = isAlive ? '#f5deb3' : '#666';
    ctx.fillRect(px + u * 2, py, u * 4, u * 4);

    // Eyes
    ctx.fillStyle = isAlive ? '#222' : '#444';
    ctx.fillRect(px + u * 3, py + u * 1, u, u);
    ctx.fillRect(px + u * 5, py + u * 1, u, u);

    if (!isAlive) {
      // X eyes for dead
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(px + u * 3, py + u * 1, u, u);
      ctx.fillRect(px + u * 5, py + u * 1, u, u);
    }

    // Body
    ctx.fillStyle = isAlive ? color : '#444';
    ctx.fillRect(px + u * 1, py + u * 4, u * 6, u * 3);

    // Arms
    ctx.fillRect(px, py + u * 4, u, u * 2);
    ctx.fillRect(px + u * 7, py + u * 4, u, u * 2);

    // Legs
    ctx.fillRect(px + u * 2, py + u * 7, u * 2, u);
    ctx.fillRect(px + u * 5, py + u * 7, u * 2, u);

    ctx.shadowBlur = 0;

    // Name
    ctx.fillStyle = isAlive ? '#e0e0e0' : '#666';
    ctx.font = 'bold 11px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(player.name, x, y + size / 2 + 4);

    // Role badge (if revealed)
    if (player.role && (!isAlive || this.winner)) {
      const icon = this.roleIcons[player.role] || '?';
      ctx.font = '14px serif';
      ctx.fillText(icon, x, y - size / 2 - 18);
    }

    // Vote count indicator
    if (player._voteCount > 0 && this.phase === 'voting') {
      ctx.fillStyle = 'rgba(220,38,38,0.9)';
      ctx.beginPath();
      ctx.arc(x + size / 2 + 5, y - size / 2 + 5, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(player._voteCount), x + size / 2 + 5, y - size / 2 + 5);
    }

    // Speaking indicator
    if (isSpeaking) {
      const bounce = Math.sin(this.time * 8) * 3;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y - size / 2 - 8 + bounce, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x - 6, y - size / 2 - 6 + bounce, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + 6, y - size / 2 - 6 + bounce, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawSpeechBubble(speech) {
    const ctx = this.ctx;
    const player = this.players.find(p => p.id === speech.playerId);
    if (!player || !player._x) return;

    const maxWidth = 280;
    const padding = 12;
    const x = player._x;
    const y = player._y;

    // Typewriter effect
    const elapsed = (Date.now() - speech._startTime) / 1000;
    const charsPerSec = 40;
    const visibleChars = Math.min(Math.floor(elapsed * charsPerSec), speech.content.length);
    const text = speech.content.substring(0, visibleChars);

    ctx.font = '12px "Inter", sans-serif';

    // Word wrap
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    for (const word of words) {
      const test = currentLine ? currentLine + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth - padding * 2) {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = test;
      }
    }
    if (currentLine) lines.push(currentLine);

    if (lines.length === 0) return;

    const lineHeight = 16;
    const bubbleW = Math.min(maxWidth, Math.max(...lines.map(l => ctx.measureText(l).width)) + padding * 2);
    const bubbleH = lines.length * lineHeight + padding * 2;

    // Position bubble above player
    let bx = x - bubbleW / 2;
    let by = y - 60 - bubbleH;

    // Keep on screen
    bx = Math.max(10, Math.min(this.w - bubbleW - 10, bx));
    by = Math.max(10, by);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    roundRect(ctx, bx + 3, by + 3, bubbleW, bubbleH, 8);
    ctx.fill();

    // Bubble background
    ctx.fillStyle = 'rgba(26,26,46,0.95)';
    roundRect(ctx, bx, by, bubbleW, bubbleH, 8);
    ctx.fill();

    // Border
    const playerIdx = this.players.indexOf(player);
    const color = this.playerColors[playerIdx % this.playerColors.length];
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    roundRect(ctx, bx, by, bubbleW, bubbleH, 8);
    ctx.stroke();

    // Pointer
    ctx.fillStyle = 'rgba(26,26,46,0.95)';
    ctx.beginPath();
    ctx.moveTo(x - 6, by + bubbleH);
    ctx.lineTo(x, by + bubbleH + 8);
    ctx.lineTo(x + 6, by + bubbleH);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x - 6, by + bubbleH);
    ctx.lineTo(x, by + bubbleH + 8);
    ctx.lineTo(x + 6, by + bubbleH);
    ctx.stroke();

    // Name tag
    ctx.fillStyle = color;
    ctx.font = 'bold 10px "Inter", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(speech.name, bx + padding, by + padding - 2);

    // Text
    ctx.fillStyle = '#e0e0e0';
    ctx.font = '12px "Inter", sans-serif';
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], bx + padding, by + padding + 14 + i * lineHeight);
    }
  }

  drawPhaseIndicator() {
    const ctx = this.ctx;
    let text = this.phase.toUpperCase();
    let color = '#f59e0b';

    switch (this.phase) {
      case 'day': color = '#f59e0b'; text = '☀️ DAY ' + this.round; break;
      case 'night': color = '#3b82f6'; text = '🌙 NIGHT ' + this.round; break;
      case 'voting': color = '#dc2626'; text = '🗳️ VOTING'; break;
      case 'resolution': color = '#dc2626'; text = '⚖️ JUDGMENT'; break;
      case 'game_over': color = '#f59e0b'; text = '🏆 GAME OVER'; break;
      default: text = '🏛️ ' + text;
    }

    ctx.fillStyle = `rgba(0,0,0,0.5)`;
    roundRect(ctx, this.w / 2 - 80, 15, 160, 32, 16);
    ctx.fill();

    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    roundRect(ctx, this.w / 2 - 80, 15, 160, 32, 16);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.font = 'bold 13px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, this.w / 2, 31);
  }

  drawWinnerOverlay() {
    const ctx = this.ctx;

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, this.w, this.h);

    const text = this.winner === 'citizens' ? '🛡️ CITIZENS WIN!' : '🗡️ TRAITORS WIN!';
    const color = this.winner === 'citizens' ? '#22c55e' : '#dc2626';

    // Glow effect
    ctx.shadowColor = color;
    ctx.shadowBlur = 30;
    ctx.fillStyle = color;
    ctx.font = 'bold 48px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, this.w / 2, this.h / 2 - 20);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#e0e0e0';
    ctx.font = '16px "Inter", sans-serif';
    ctx.fillText(`Game ended after ${this.round} rounds`, this.w / 2, this.h / 2 + 30);

    // Show all roles
    const aliveCount = this.players.filter(p => p.alive).length;
    const deadCount = this.players.length - aliveCount;
    ctx.fillStyle = '#888';
    ctx.font = '14px "Inter", sans-serif';
    ctx.fillText(`${aliveCount} survived • ${deadCount} eliminated`, this.w / 2, this.h / 2 + 55);
  }

  updateFromState(state) {
    this.phase = state.phase || 'lobby';
    this.round = state.round || 0;

    if (state.players) {
      this.players = state.players.map(p => ({
        ...p,
        _voteCount: 0,
        _x: 0,
        _y: 0
      }));
    }

    if (state.winner) {
      this.winner = state.winner;
    }
  }

  handleEvent(event) {
    switch (event.type) {
      case 'game_start':
        this.phase = 'day';
        break;

      case 'phase_change':
        this.phase = event.data.phase;
        this.round = event.round || this.round;
        if (event.data.round) this.round = event.data.round;

        // Reset vote counts
        if (event.data.phase === 'voting') {
          this.players.forEach(p => p._voteCount = 0);
        }
        break;

      case 'speech':
        this.showSpeech(event.data);
        break;

      case 'vote_cast':
        const target = this.players.find(p => p.id === event.data.targetId);
        if (target) target._voteCount = (target._voteCount || 0) + 1;
        break;

      case 'elimination':
        const eliminated = this.players.find(p => p.id === event.data.playerId);
        if (eliminated) {
          eliminated.alive = false;
          eliminated.role = event.data.role;
          this.eliminationAnim = { playerId: event.data.playerId, progress: 0 };
        }
        break;

      case 'night_kill':
        if (event.data.targetId) {
          const killed = this.players.find(p => p.id === event.data.targetId);
          if (killed) {
            killed.alive = false;
            killed.role = event.data.role;
          }
        }
        break;

      case 'game_over':
        this.winner = event.data.winner;
        this.phase = 'game_over';
        if (event.data.players) {
          for (const ep of event.data.players) {
            const p = this.players.find(pp => pp.id === ep.id);
            if (p) {
              p.role = ep.role;
              p.alive = ep.alive;
            }
          }
        }
        break;

      case 'player_join':
        if (!this.players.find(p => p.id === event.data.playerId)) {
          this.players.push({
            id: event.data.playerId,
            name: event.data.name,
            alive: true,
            role: null,
            _voteCount: 0,
            _x: 0,
            _y: 0
          });
        }
        break;
    }
  }

  showSpeech(data) {
    this.activeSpeech = {
      ...data,
      _startTime: Date.now()
    };
    clearTimeout(this.speechTimer);
    const duration = Math.max(2500, Math.min(data.content.length * 50, 6000));
    this.speechTimer = setTimeout(() => {
      this.activeSpeech = null;
    }, duration);
  }
}

// Utility: rounded rectangle
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
