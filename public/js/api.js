const API_BASE = '';

const api = {
  async listGames() {
    const res = await fetch(`${API_BASE}/api/games`);
    return res.json();
  },

  async createDemo() {
    const res = await fetch(`${API_BASE}/api/games/demo`, { method: 'POST' });
    return res.json();
  },

  async getGameState(id) {
    const res = await fetch(`${API_BASE}/api/games/${id}/state`);
    return res.json();
  },

  async getReplay(id) {
    const res = await fetch(`${API_BASE}/api/games/${id}/replay`);
    return res.json();
  },

  async getLeaderboard() {
    const res = await fetch(`${API_BASE}/api/leaderboard`);
    return res.json();
  },

  async listReplays() {
    const res = await fetch(`${API_BASE}/api/replays`);
    return res.json();
  },

  connectSpectate(gameId, onMessage) {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${location.host}/ws/spectate/${gameId}`);
    ws.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        onMessage(event);
      } catch (err) {
        console.error('WS parse error:', err);
      }
    };
    ws.onerror = (e) => console.error('WS error:', e);
    ws.onclose = () => console.log('WS closed');
    return ws;
  }
};
