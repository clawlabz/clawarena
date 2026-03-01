import { BaseGame } from './BaseGame.mjs';

export class TribunalGame extends BaseGame {
  constructor(options = {}) {
    super(options);
    this.type = 'tribunal';
    this.phase = 'lobby';
    this.phaseTimer = null;
    this.votes = new Map();
    this.speeches = [];
    this.nightActions = { kills: [], investigate: null };
    this.speedMultiplier = options.speed || 1;
    this.isDemo = options.isDemo || false;
    this.onNpcAction = options.onNpcAction || null;
    this.dayDuration = Math.floor(30000 / this.speedMultiplier);
    this.voteDuration = Math.floor(15000 / this.speedMultiplier);
    this.nightDuration = Math.floor(10000 / this.speedMultiplier);
    this.speechDelay = Math.floor(3000 / this.speedMultiplier);
    this.winner = null;
    this.eliminatedThisRound = null;
    this.investigationResults = new Map();
  }

  assignRoles() {
    const players = [...this.players.values()];
    const count = players.length;
    const traitorCount = count <= 6 ? 2 : 3;
    const hasDetective = count >= 6;
    const shuffled = players.sort(() => Math.random() - 0.5);
    for (let i = 0; i < traitorCount; i++) {
      shuffled[i].role = 'traitor';
    }
    if (hasDetective) {
      shuffled[traitorCount].role = 'detective';
    }
    for (let i = hasDetective ? traitorCount + 1 : traitorCount; i < shuffled.length; i++) {
      shuffled[i].role = 'citizen';
    }
    this.emit('roles_assigned', {
      count: { traitors: traitorCount, detective: hasDetective ? 1 : 0, citizens: count - traitorCount - (hasDetective ? 1 : 0) }
    });
  }

  start() {
    super.start();
    this.assignRoles();
    this.emit('game_start', {
      playerCount: this.players.size,
      players: [...this.players.values()].map(p => ({ id: p.id, name: p.name }))
    });
    setTimeout(() => this.startDay(), 2000);
  }

  startDay() {
    this.round++;
    this.phase = 'day';
    this.speeches = [];
    this.votes.clear();
    this.eliminatedThisRound = null;
    this.emit('phase_change', { phase: 'day', round: this.round });

    if (this.isDemo && this.onNpcAction) {
      this.runNpcSpeeches();
    } else {
      this.phaseTimer = setTimeout(() => this.startVoting(), this.dayDuration);
    }
  }

  async runNpcSpeeches() {
    const alive = this.getAlive();
    const speakOrder = alive.sort(() => Math.random() - 0.5);
    for (const player of speakOrder) {
      if (this.status !== 'playing') return;
      if (!player.alive) continue;
      if (this.onNpcAction) {
        const speech = await this.onNpcAction(player.id, 'speak', this.getGameContext());
        if (speech) {
          this.addSpeech(player.id, speech);
        }
      }
      await this.delay(this.speechDelay);
    }
    await this.delay(1000);
    this.startVoting();
  }

  addSpeech(playerId, content) {
    const player = this.players.get(playerId);
    if (!player || !player.alive) return;
    const speech = { playerId, name: player.name, content, timestamp: Date.now() };
    this.speeches.push(speech);
    this.emit('speech', speech);
  }

  startVoting() {
    if (this.status !== 'playing') return;
    this.phase = 'voting';
    this.votes.clear();
    this.emit('phase_change', { phase: 'voting', round: this.round });

    if (this.isDemo && this.onNpcAction) {
      this.runNpcVotes();
    } else {
      this.phaseTimer = setTimeout(() => this.resolveVotes(), this.voteDuration);
    }
  }

  async runNpcVotes() {
    const alive = this.getAlive();
    for (const player of alive) {
      if (this.status !== 'playing') return;
      if (!player.alive) continue;
      if (this.onNpcAction) {
        const targetId = await this.onNpcAction(player.id, 'vote', this.getGameContext());
        if (targetId) {
          this.castVote(player.id, targetId);
        }
      }
      await this.delay(500);
    }
    await this.delay(1000);
    this.resolveVotes();
  }

  castVote(voterId, targetId) {
    const voter = this.players.get(voterId);
    const target = this.players.get(targetId);
    if (!voter || !target || !voter.alive || !target.alive) return;
    this.votes.set(voterId, targetId);
    this.emit('vote_cast', { voterId, voterName: voter.name, targetId, targetName: target.name });
  }

  resolveVotes() {
    if (this.status !== 'playing') return;
    this.phase = 'resolution';
    const tally = new Map();
    for (const [, targetId] of this.votes) {
      tally.set(targetId, (tally.get(targetId) || 0) + 1);
    }
    this.emit('vote_result', {
      tally: Object.fromEntries([...tally.entries()].map(([id, count]) => {
        const p = this.players.get(id);
        return [p ? p.name : id, count];
      }))
    });

    let maxVotes = 0;
    let candidates = [];
    for (const [id, count] of tally) {
      if (count > maxVotes) {
        maxVotes = count;
        candidates = [id];
      } else if (count === maxVotes) {
        candidates.push(id);
      }
    }

    if (candidates.length === 1 && maxVotes > 0) {
      const eliminated = this.players.get(candidates[0]);
      this.eliminatedThisRound = candidates[0];
      this.eliminate(candidates[0], 'voted_out');
      this.emit('phase_change', { phase: 'resolution', round: this.round, eliminated: eliminated.name, role: eliminated.role });
    } else {
      this.emit('phase_change', { phase: 'resolution', round: this.round, eliminated: null, tie: candidates.length > 1 });
    }

    const winCheck = this.checkWin();
    if (winCheck) {
      this.endGame(winCheck);
      return;
    }

    setTimeout(() => this.startNight(), 3000);
  }

  startNight() {
    if (this.status !== 'playing') return;
    this.phase = 'night';
    this.nightActions = { kills: [], investigate: null };
    this.emit('phase_change', { phase: 'night', round: this.round });

    if (this.isDemo && this.onNpcAction) {
      this.runNpcNight();
    } else {
      this.phaseTimer = setTimeout(() => this.resolveNight(), this.nightDuration);
    }
  }

  async runNpcNight() {
    const alive = this.getAlive();
    const traitors = alive.filter(p => p.role === 'traitor');
    const detective = alive.find(p => p.role === 'detective');

    if (traitors.length > 0 && this.onNpcAction) {
      const targetId = await this.onNpcAction(traitors[0].id, 'kill', this.getGameContext());
      if (targetId) {
        this.nightActions.kills.push(targetId);
      }
    }

    if (detective && this.onNpcAction) {
      const targetId = await this.onNpcAction(detective.id, 'investigate', this.getGameContext());
      if (targetId) {
        this.nightActions.investigate = { detectiveId: detective.id, targetId };
        const target = this.players.get(targetId);
        if (target) {
          this.investigationResults.set(targetId, target.role === 'traitor');
          this.emit('investigation_result', {
            detectiveId: detective.id,
            targetId,
            targetName: target.name,
            isTraitor: target.role === 'traitor'
          });
        }
      }
    }

    await this.delay(2000);
    this.resolveNight();
  }

  resolveNight() {
    if (this.status !== 'playing') return;
    if (this.nightActions.kills.length > 0) {
      const targetId = this.nightActions.kills[0];
      const target = this.players.get(targetId);
      if (target && target.alive) {
        this.eliminate(targetId, 'killed_at_night');
        this.emit('night_kill', { targetId, targetName: target.name, role: target.role });
      }
    } else {
      this.emit('night_kill', { targetId: null, targetName: null, noKill: true });
    }

    const winCheck = this.checkWin();
    if (winCheck) {
      this.endGame(winCheck);
      return;
    }

    setTimeout(() => this.startDay(), 2000);
  }

  checkWin() {
    const alive = this.getAlive();
    const traitors = alive.filter(p => p.role === 'traitor');
    const others = alive.filter(p => p.role !== 'traitor');

    if (traitors.length === 0) return 'citizens';
    if (traitors.length >= others.length) return 'traitors';
    return null;
  }

  endGame(winner) {
    this.winner = winner;
    this.phase = 'game_over';
    this.emit('game_over', {
      winner,
      rounds: this.round,
      players: [...this.players.values()].map(p => ({
        id: p.id, name: p.name, role: p.role, alive: p.alive
      }))
    });
    this.end();
  }

  getGameContext() {
    return {
      round: this.round,
      phase: this.phase,
      alive: this.getAlive().map(p => ({ id: p.id, name: p.name })),
      speeches: this.speeches.slice(-20),
      votes: Object.fromEntries(this.votes),
      eliminatedThisRound: this.eliminatedThisRound,
      investigationResults: this.investigationResults
    };
  }

  getState() {
    return {
      ...super.getState(),
      type: this.type,
      phase: this.phase,
      round: this.round,
      speeches: this.speeches,
      votes: Object.fromEntries(this.votes),
      winner: this.winner,
      isDemo: this.isDemo
    };
  }

  submitAction(playerId, action) {
    const player = this.players.get(playerId);
    if (!player || !player.alive) return { error: 'Invalid player' };

    switch (action.type) {
      case 'speak':
        if (this.phase !== 'day') return { error: 'Not day phase' };
        this.addSpeech(playerId, action.content);
        return { success: true };
      case 'vote':
        if (this.phase !== 'voting') return { error: 'Not voting phase' };
        this.castVote(playerId, action.targetId);
        return { success: true };
      case 'kill':
        if (this.phase !== 'night' || player.role !== 'traitor') return { error: 'Invalid action' };
        this.nightActions.kills.push(action.targetId);
        return { success: true };
      case 'investigate':
        if (this.phase !== 'night' || player.role !== 'detective') return { error: 'Invalid action' };
        this.nightActions.investigate = { detectiveId: playerId, targetId: action.targetId };
        return { success: true };
      default:
        return { error: 'Unknown action' };
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
