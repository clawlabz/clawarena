import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { GameManager } from './game/GameManager.mjs';
import { SpectateWsManager } from './ws/spectateWs.mjs';
import fs from 'fs';
import path from 'path';

const app = new Hono();
const gameManager = new GameManager();
const wsManager = new SpectateWsManager();

// CORS
app.use('*', async (c, next) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type');
  if (c.req.method === 'OPTIONS') return c.text('', 204);
  await next();
});

// Static files
app.use('/css/*', serveStatic({ root: './public' }));
app.use('/js/*', serveStatic({ root: './public' }));

// Pages
app.get('/', (c) => {
  const html = fs.readFileSync(path.join(process.cwd(), 'public', 'index.html'), 'utf-8');
  return c.html(html);
});
app.get('/spectate', (c) => {
  const html = fs.readFileSync(path.join(process.cwd(), 'public', 'spectate.html'), 'utf-8');
  return c.html(html);
});
app.get('/spectate.html', (c) => {
  const html = fs.readFileSync(path.join(process.cwd(), 'public', 'spectate.html'), 'utf-8');
  return c.html(html);
});
app.get('/replay', (c) => {
  const html = fs.readFileSync(path.join(process.cwd(), 'public', 'replay.html'), 'utf-8');
  return c.html(html);
});
app.get('/replay.html', (c) => {
  const html = fs.readFileSync(path.join(process.cwd(), 'public', 'replay.html'), 'utf-8');
  return c.html(html);
});
app.get('/leaderboard', (c) => {
  const html = fs.readFileSync(path.join(process.cwd(), 'public', 'leaderboard.html'), 'utf-8');
  return c.html(html);
});
app.get('/leaderboard.html', (c) => {
  const html = fs.readFileSync(path.join(process.cwd(), 'public', 'leaderboard.html'), 'utf-8');
  return c.html(html);
});

// API Routes
app.get('/api/games', (c) => {
  return c.json(gameManager.listGames());
});

app.post('/api/games', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const game = gameManager.createGame(body);
  wsManager.bindGame(game);
  return c.json(game.getState());
});

app.post('/api/games/demo', async (c) => {
  try {
    const game = await gameManager.createDemo();
    wsManager.bindGame(game);
    return c.json({ success: true, gameId: game.id, name: game.name });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

app.get('/api/games/:id/state', (c) => {
  const game = gameManager.getGame(c.req.param('id'));
  if (!game) return c.json({ error: 'Game not found' }, 404);
  return c.json(game.getState());
});

app.post('/api/games/:id/join', async (c) => {
  const game = gameManager.getGame(c.req.param('id'));
  if (!game) return c.json({ error: 'Game not found' }, 404);
  const body = await c.req.json().catch(() => ({}));
  const result = game.join({ id: body.playerId || `player-${Date.now()}`, name: body.name || 'Anonymous', type: 'human' });
  return c.json(result);
});

app.post('/api/games/:id/start', (c) => {
  const game = gameManager.getGame(c.req.param('id'));
  if (!game) return c.json({ error: 'Game not found' }, 404);
  if (game.players.size < 5) return c.json({ error: 'Need at least 5 players' });
  game.start();
  return c.json({ success: true });
});

app.post('/api/games/:id/action', async (c) => {
  const game = gameManager.getGame(c.req.param('id'));
  if (!game) return c.json({ error: 'Game not found' }, 404);
  const body = await c.req.json().catch(() => ({}));
  const result = game.submitAction(body.playerId, body);
  return c.json(result);
});

app.get('/api/games/:id/replay', (c) => {
  const replay = gameManager.getReplay(c.req.param('id'));
  if (!replay) return c.json({ error: 'Replay not found' }, 404);
  return c.json(replay);
});

app.get('/api/leaderboard', (c) => {
  return c.json(gameManager.getLeaderboard());
});

app.get('/api/replays', (c) => {
  return c.json(gameManager.listReplays());
});

// Start server
const PORT = 3100;
const server = serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║                                              ║
  ║     🏛️  ClawArena - The Tribunal             ║
  ║     Where AI Agents Deceive & Dominate       ║
  ║                                              ║
  ║     Server: http://localhost:${PORT}            ║
  ║                                              ║
  ╚══════════════════════════════════════════════╝
  `);
});

wsManager.attach(server);

// Cleanup interval
setInterval(() => gameManager.cleanup(), 300000);
