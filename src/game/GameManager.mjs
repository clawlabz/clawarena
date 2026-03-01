import { TribunalGame } from './TribunalGame.mjs';
import { AgentRegistry } from '../agents/AgentRegistry.mjs';
import { NpcAgent } from '../agents/NpcAgent.mjs';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const GAMES_DIR = path.join(DATA_DIR, 'games');
const REPLAYS_DIR = path.join(DATA_DIR, 'replays');

function ensureDirs() {
  [DATA_DIR, GAMES_DIR, REPLAYS_DIR].forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });
}

export class GameManager {
  constructor() {
    this.games = new Map();
    this.registry = new AgentRegistry();
    this.leaderboard = this.loadLeaderboard();
    ensureDirs();
  }

  createGame(options = {}) {
    const game = new TribunalGame(options);
    this.games.set(game.id, game);
    game.on('game_over', (event) => {
      this.onGameOver(game);
    });
    return game;
  }

  getGame(id) {
    return this.games.get(id);
  }

  listGames() {
    return [...this.games.values()].map(g => g.getState());
  }

  listActiveGames() {
    return [...this.games.values()].filter(g => g.status !== 'finished').map(g => g.getState());
  }

  async createDemo() {
    const game = this.createGame({
      name: `Demo-${Date.now().toString(36)}`,
      isDemo: true,
      speed: 1
    });

    const npcNames = this.registry.generateNpcTeam(8);
    const npcAgents = new Map();

    for (const npc of npcNames) {
      const agent = new NpcAgent(npc.id, npc.name, npc.personality);
      npcAgents.set(npc.id, agent);
      game.join({ id: npc.id, name: npc.name, type: 'npc' });
    }

    game.onNpcAction = async (playerId, actionType, context) => {
      const agent = npcAgents.get(playerId);
      if (!agent) return null;
      const player = game.getPlayer(playerId);
      if (!player) return null;

      const fullContext = {
        ...context,
        myRole: player.role,
        myName: player.name,
        myId: player.id,
        investigationResults: player.role === 'detective'
          ? Object.fromEntries(game.investigationResults)
          : {}
      };

      switch (actionType) {
        case 'speak': return agent.generateSpeech(fullContext);
        case 'vote': return agent.chooseVoteTarget(fullContext);
        case 'kill': return agent.chooseKillTarget(fullContext);
        case 'investigate': return agent.chooseInvestigateTarget(fullContext);
        default: return null;
      }
    };

    game.start();
    return game;
  }

  onGameOver(game) {
    try {
      const replay = game.getReplay();
      const replayPath = path.join(REPLAYS_DIR, `${game.id}.json`);
      fs.writeFileSync(replayPath, JSON.stringify(replay, null, 2));
      this.updateLeaderboard(game);
    } catch (e) {
      console.error('Error saving replay:', e.message);
    }
  }

  updateLeaderboard(game) {
    const players = [...game.players.values()];
    for (const player of players) {
      if (!this.leaderboard[player.name]) {
        this.leaderboard[player.name] = {
          name: player.name,
          games: 0, wins: 0, losses: 0,
          survivals: 0, eliminations: 0,
          rolesPlayed: { citizen: 0, traitor: 0, detective: 0 }
        };
      }
      const entry = this.leaderboard[player.name];
      entry.games++;
      entry.rolesPlayed[player.role] = (entry.rolesPlayed[player.role] || 0) + 1;

      const isTraitor = player.role === 'traitor';
      const traitorWon = game.winner === 'traitors';
      if ((isTraitor && traitorWon) || (!isTraitor && !traitorWon)) {
        entry.wins++;
      } else {
        entry.losses++;
      }
      if (player.alive) entry.survivals++;
      else entry.eliminations++;
    }
    this.saveLeaderboard();
  }

  getLeaderboard() {
    return Object.values(this.leaderboard)
      .map(e => ({
        ...e,
        winRate: e.games > 0 ? Math.round((e.wins / e.games) * 100) : 0,
        survivalRate: e.games > 0 ? Math.round((e.survivals / e.games) * 100) : 0
      }))
      .sort((a, b) => b.winRate - a.winRate || b.wins - a.wins);
  }

  loadLeaderboard() {
    try {
      const p = path.join(DATA_DIR, 'leaderboard.json');
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf-8'));
    } catch (e) {}
    return {};
  }

  saveLeaderboard() {
    try {
      fs.writeFileSync(path.join(DATA_DIR, 'leaderboard.json'), JSON.stringify(this.leaderboard, null, 2));
    } catch (e) {
      console.error('Error saving leaderboard:', e.message);
    }
  }

  getReplay(gameId) {
    try {
      const p = path.join(REPLAYS_DIR, `${gameId}.json`);
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf-8'));
    } catch (e) {}
    const game = this.games.get(gameId);
    if (game) return game.getReplay();
    return null;
  }

  listReplays() {
    try {
      const files = fs.readdirSync(REPLAYS_DIR).filter(f => f.endsWith('.json'));
      return files.map(f => {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(REPLAYS_DIR, f), 'utf-8'));
          return { id: data.id, name: data.name, players: data.players?.length, createdAt: data.createdAt, endedAt: data.endedAt };
        } catch { return null; }
      }).filter(Boolean);
    } catch { return []; }
  }

  cleanup() {
    for (const [id, game] of this.games) {
      if (game.status === 'finished' && Date.now() - game.endedAt > 3600000) {
        this.games.delete(id);
      }
    }
  }
}
