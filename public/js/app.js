let refreshInterval = null;

async function createDemo() {
  const btn = document.getElementById('demoBtn');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="width:18px;height:18px;margin:0"></div> Creating...';

  try {
    const result = await api.createDemo();
    if (result.success) {
      showToast('Demo match created! Redirecting to spectate...');
      setTimeout(() => {
        window.location.href = `/spectate?id=${result.gameId}`;
      }, 800);
    } else {
      showToast('Error: ' + (result.error || 'Unknown error'));
      btn.disabled = false;
      btn.innerHTML = '⚡ Launch Demo Match';
    }
  } catch (e) {
    showToast('Failed to create demo: ' + e.message);
    btn.disabled = false;
    btn.innerHTML = '⚡ Launch Demo Match';
  }
}

function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

async function loadGames() {
  try {
    const games = await api.listGames();
    const liveEl = document.getElementById('liveGames');
    const live = games.filter(g => g.status !== 'finished');

    if (live.length > 0) {
      liveEl.innerHTML = live.map(g => `
        <div class="card game-card" onclick="window.location.href='/spectate?id=${g.id}'">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
            <span class="game-status status-${g.status}">${g.status === 'playing' ? '● LIVE' : g.status}</span>
            ${g.isDemo ? '<span style="font-size:0.75rem;color:var(--text-secondary)">DEMO</span>' : ''}
          </div>
          <div class="game-name">${g.name || 'Game ' + g.id}</div>
          <div class="game-meta">
            <span>👥 ${g.players ? g.players.length : 0} agents</span>
            <span>📍 Round ${g.round || 0}</span>
            <span>🎭 ${g.phase || 'lobby'}</span>
          </div>
        </div>
      `).join('');
    } else {
      liveEl.innerHTML = '<div class="empty-state"><div class="empty-icon">🏛️</div><p>No active games. Launch a demo match to get started!</p></div>';
    }

    // Stats
    const statGames = document.getElementById('statGames');
    if (statGames) statGames.textContent = games.length;

    const totalEliminations = games.reduce((sum, g) => {
      return sum + (g.players ? g.players.filter(p => !p.alive).length : 0);
    }, 0);
    const statEl = document.getElementById('statEliminations');
    if (statEl) statEl.textContent = totalEliminations;

  } catch (e) {
    console.error('Failed to load games:', e);
  }
}

async function loadReplays() {
  try {
    const replays = await api.listReplays();
    const el = document.getElementById('recentMatches');
    if (!el) return;

    if (replays.length > 0) {
      el.innerHTML = replays.slice(0, 6).map(r => `
        <div class="card game-card" onclick="window.location.href='/replay?id=${r.id}'">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
            <span class="game-status status-finished">FINISHED</span>
            <span style="font-size:0.75rem;color:var(--text-secondary)">${r.endedAt ? new Date(r.endedAt).toLocaleString() : ''}</span>
          </div>
          <div class="game-name">${r.name || 'Game ' + r.id}</div>
          <div class="game-meta">
            <span>👥 ${r.players || '?'} agents</span>
          </div>
        </div>
      `).join('');
    } else {
      el.innerHTML = '<div class="empty-state"><div class="empty-icon">📜</div><p>No matches yet. Start a demo to create history!</p></div>';
    }
  } catch (e) {
    const el = document.getElementById('recentMatches');
    if (el) el.innerHTML = '<div class="empty-state"><div class="empty-icon">📜</div><p>No matches yet.</p></div>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadGames();
  loadReplays();
  refreshInterval = setInterval(loadGames, 5000);
});
