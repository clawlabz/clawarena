import { randomUUID } from 'crypto';

export class BaseGame {
  constructor(options = {}) {
    this.id = options.id || randomUUID().slice(0, 8);
    this.name = options.name || `Game-${this.id}`;
    this.status = 'lobby'; // lobby, playing, finished
    this.players = new Map();
    this.events = [];
    this.listeners = new Map();
    this.createdAt = Date.now();
    this.startedAt = null;
    this.endedAt = null;
    this.round = 0;
    this.log = [];
  }

  join(player) {
    if (this.status !== 'lobby') return { error: 'Game already started' };
    if (this.players.has(player.id)) return { error: 'Already joined' };
    this.players.set(player.id, {
      id: player.id,
      name: player.name,
      type: player.type || 'human',
      alive: true,
      role: null,
      joinedAt: Date.now()
    });
    this.emit('player_join', { playerId: player.id, name: player.name });
    return { success: true };
  }

  leave(playerId) {
    if (!this.players.has(playerId)) return { error: 'Not in game' };
    this.players.delete(playerId);
    this.emit('player_leave', { playerId });
    return { success: true };
  }

  getAlive() {
    return [...this.players.values()].filter(p => p.alive);
  }

  getPlayer(id) {
    return this.players.get(id);
  }

  eliminate(playerId, reason = 'eliminated') {
    const player = this.players.get(playerId);
    if (player) {
      player.alive = false;
      this.emit('elimination', { playerId, name: player.name, role: player.role, reason });
    }
  }

  emit(type, data = {}) {
    const event = {
      type,
      data,
      timestamp: Date.now(),
      round: this.round
    };
    this.events.push(event);
    this.log.push(event);
    const handlers = this.listeners.get(type) || [];
    handlers.forEach(fn => fn(event));
    const allHandlers = this.listeners.get('*') || [];
    allHandlers.forEach(fn => fn(event));
  }

  on(type, handler) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(handler);
  }

  off(type, handler) {
    const handlers = this.listeners.get(type) || [];
    this.listeners.set(type, handlers.filter(h => h !== handler));
  }

  getState() {
    return {
      id: this.id,
      name: this.name,
      status: this.status,
      round: this.round,
      players: [...this.players.values()].map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        alive: p.alive,
        role: this.status === 'finished' ? p.role : (p.alive ? undefined : p.role)
      })),
      createdAt: this.createdAt,
      startedAt: this.startedAt,
      endedAt: this.endedAt
    };
  }

  getReplay() {
    return {
      id: this.id,
      name: this.name,
      players: [...this.players.values()],
      events: this.events,
      createdAt: this.createdAt,
      startedAt: this.startedAt,
      endedAt: this.endedAt,
      round: this.round
    };
  }

  start() {
    this.status = 'playing';
    this.startedAt = Date.now();
  }

  end() {
    this.status = 'finished';
    this.endedAt = Date.now();
  }
}
