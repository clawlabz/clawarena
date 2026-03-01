import { WebSocketServer } from 'ws';

export class SpectateWsManager {
  constructor() {
    this.rooms = new Map();
    this.wss = null;
  }

  attach(server) {
    this.wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (request, socket, head) => {
      const url = new URL(request.url, `http://${request.headers.host}`);
      const match = url.pathname.match(/^\/ws\/spectate\/(.+)$/);
      if (match) {
        const gameId = match[1];
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.handleConnection(ws, gameId);
        });
      } else {
        socket.destroy();
      }
    });
  }

  handleConnection(ws, gameId) {
    if (!this.rooms.has(gameId)) {
      this.rooms.set(gameId, new Set());
    }
    this.rooms.get(gameId).add(ws);

    ws.send(JSON.stringify({ type: 'connected', data: { gameId, message: 'Spectating game' } }));

    ws.on('close', () => {
      const room = this.rooms.get(gameId);
      if (room) {
        room.delete(ws);
        if (room.size === 0) this.rooms.delete(gameId);
      }
    });

    ws.on('error', () => {
      const room = this.rooms.get(gameId);
      if (room) room.delete(ws);
    });
  }

  broadcast(gameId, event) {
    const room = this.rooms.get(gameId);
    if (!room) return;
    const msg = JSON.stringify(event);
    for (const ws of room) {
      if (ws.readyState === 1) {
        try { ws.send(msg); } catch (e) {}
      }
    }
  }

  getSpectatorCount(gameId) {
    const room = this.rooms.get(gameId);
    return room ? room.size : 0;
  }

  bindGame(game) {
    game.on('*', (event) => {
      this.broadcast(game.id, event);
    });
  }
}
