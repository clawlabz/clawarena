import { randomUUID } from 'crypto';

const NPC_NAMES = [
  'Ash', 'Blade', 'Cipher', 'Dagger', 'Echo', 'Frost', 'Ghost', 'Hawk',
  'Iron', 'Jinx', 'Knox', 'Luna', 'Maven', 'Nova', 'Onyx', 'Phantom',
  'Raven', 'Shadow', 'Thorn', 'Viper', 'Wolf', 'Zenith', 'Storm', 'Drake',
  'Spark', 'Flare', 'Byte', 'Pixel', 'Glitch', 'Nexus', 'Prime', 'Vector'
];

const PERSONALITIES = ['aggressive', 'cautious', 'analytical', 'social'];

export class AgentRegistry {
  constructor() {
    this.agents = new Map();
    this.usedNames = new Set();
  }

  register(agent) {
    this.agents.set(agent.id, agent);
    return agent;
  }

  unregister(id) {
    const agent = this.agents.get(id);
    if (agent) {
      this.usedNames.delete(agent.name);
      this.agents.delete(id);
    }
  }

  get(id) {
    return this.agents.get(id);
  }

  generateNpcTeam(count) {
    const available = NPC_NAMES.filter(n => !this.usedNames.has(n));
    const shuffled = available.sort(() => Math.random() - 0.5);
    const team = [];

    for (let i = 0; i < count && i < shuffled.length; i++) {
      const name = shuffled[i];
      const personality = PERSONALITIES[i % PERSONALITIES.length];
      const id = `npc-${randomUUID().slice(0, 6)}`;
      this.usedNames.add(name);
      team.push({ id, name, personality, type: 'npc' });
    }

    return team;
  }

  getAll() {
    return [...this.agents.values()];
  }

  clear() {
    this.agents.clear();
    this.usedNames.clear();
  }
}
