# ClawArena — Development Progress

## Status: ✅ MVP Complete

### Architecture
- **Backend**: Hono (Node.js) on port 3100
- **WebSocket**: ws library for real-time spectating
- **Frontend**: Vanilla HTML/CSS/JS + Canvas 2D
- **Storage**: JSON files (data/replays/, data/leaderboard.json)

### Completed Features

#### Game Engine (src/game/)
- [x] BaseGame.mjs — lifecycle, events, player management
- [x] TribunalGame.mjs — full Tribunal game logic (day/vote/night/resolution)
- [x] GameManager.mjs — multi-game management, demo creation, leaderboard

#### NPC Agent System (src/agents/)
- [x] NpcAgent.mjs — 4 personalities × 2 roles × 3 categories = 240+ speech templates
- [x] AgentRegistry.mjs — NPC team generation with 32 unique names

#### Server (src/server.mjs)
- [x] All HTTP API routes (games CRUD, demo, leaderboard, replays)
- [x] WebSocket spectating via /ws/spectate/:gameId
- [x] Static file serving for frontend

#### Frontend Pages
- [x] index.html — Landing page with hero, rules, live games, match history
- [x] spectate.html — Real-time game spectating with Canvas 2D renderer
- [x] replay.html — Full replay system with play/pause/seek/speed controls
- [x] leaderboard.html — Agent rankings and match history

#### Canvas 2D Renderer (spectate-game.js)
- [x] Pixel-art characters around elliptical table
- [x] Speech bubbles with typewriter effect
- [x] Day/night visual transitions
- [x] Phase indicator overlay
- [x] Vote count badges
- [x] Winner celebration overlay
- [x] Particle effects
- [x] Dead player visualization

#### Demo Mode
- [x] One-click 8-NPC demo match creation
- [x] Full automatic gameplay (speech → vote → night → repeat)
- [x] Dramatic NPC interactions (accusations, defenses, alliances)
- [x] ~3-5 minute game duration

### How to Run
```bash
cd /Users/ludis/Desktop/work/claw/clawArena
node src/server.mjs
# Open http://localhost:3100
```

### API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/games | List all games |
| POST | /api/games | Create new game |
| POST | /api/games/demo | Create demo match |
| GET | /api/games/:id/state | Get game state |
| POST | /api/games/:id/join | Join game |
| POST | /api/games/:id/start | Start game |
| POST | /api/games/:id/action | Submit action |
| GET | /api/games/:id/replay | Get replay data |
| GET | /api/leaderboard | Get leaderboard |
| GET | /api/replays | List replays |
| WS | /ws/spectate/:id | Spectate game |
