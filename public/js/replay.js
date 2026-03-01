let replayData = null;
let replayIndex = 0;
let isPlaying = false;
let playInterval = null;
let playSpeed = 1;
let renderer = null;

const params = new URLSearchParams(window.location.search);
const gameId = params.get('id');

document.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('gameCanvas');
  renderer = new TribunalRenderer(canvas);

  if (!gameId) {
    document.querySelector('.canvas-container').innerHTML = '<div class="empty-state"><div class="empty-icon">📼</div><p>No replay ID specified. <a href="/" style="color:var(--accent-red)">Go back</a></p></div>';
    return;
  }

  document.getElementById('replayInfo').textContent = 'Replay: ' + gameId;

  try {
    replayData = await api.getReplay(gameId);
    if (!replayData || replayData.error) {
      document.querySelector('.canvas-container').innerHTML = '<div class="empty-state"><div class="empty-icon">❌</div><p>Replay not found. <a href="/" style="color:var(--accent-red)">Go back</a></p></div>';
      return;
    }

    // Initialize players
    if (replayData.players) {
      renderer.players = replayData.players.map(p => ({
        ...p,
        alive: true,
        _voteCount: 0,
        _x: 0,
        _y: 0
      }));
      updatePlayerList();
    }

    document.getElementById('eventCounter').textContent = `0/${replayData.events.length}`;
  } catch (e) {
    console.error('Failed to load replay:', e);
  }
});

function togglePlay() {
  if (!replayData) return;
  isPlaying = !isPlaying;
  document.getElementById('playBtn').textContent = isPlaying ? '⏸' : '▶️';

  if (isPlaying) {
    playNext();
  } else {
    clearTimeout(playInterval);
  }
}

function playNext() {
  if (!isPlaying || !replayData || replayIndex >= replayData.events.length) {
    isPlaying = false;
    document.getElementById('playBtn').textContent = '▶️';
    return;
  }

  const event = replayData.events[replayIndex];
  applyEvent(event);
  replayIndex++;
  updateProgress();

  const delay = getEventDelay(event) / playSpeed;
  playInterval = setTimeout(playNext, delay);
}

function stepForward() {
  if (!replayData || replayIndex >= replayData.events.length) return;
  clearTimeout(playInterval);
  isPlaying = false;
  document.getElementById('playBtn').textContent = '▶️';

  const event = replayData.events[replayIndex];
  applyEvent(event);
  replayIndex++;
  updateProgress();
}

function stepBack() {
  if (!replayData || replayIndex <= 0) return;
  clearTimeout(playInterval);
  isPlaying = false;
  document.getElementById('playBtn').textContent = '▶️';

  // Reset and replay up to previous event
  replayIndex = Math.max(0, replayIndex - 2);
  resetState();
  for (let i = 0; i <= replayIndex; i++) {
    applyEvent(replayData.events[i], true);
  }
  replayIndex++;
  updateProgress();
}

function resetState() {
  if (!replayData) return;
  renderer.players = replayData.players.map(p => ({
    ...p,
    alive: true,
    _voteCount: 0,
    _x: 0,
    _y: 0
  }));
  renderer.phase = 'lobby';
  renderer.round = 0;
  renderer.winner = null;
  renderer.activeSpeech = null;
  document.getElementById('gameLog').innerHTML = '';
}

function applyEvent(event, silent) {
  renderer.handleEvent(event);
  if (!silent) addLogEntry(event);
  updatePlayerList();
  updatePhaseBanner(event);
}

function getEventDelay(event) {
  switch (event.type) {
    case 'speech': return 2000;
    case 'vote_cast': return 400;
    case 'phase_change': return 1500;
    case 'elimination': return 2000;
    case 'night_kill': return 2000;
    case 'game_over': return 3000;
    default: return 800;
  }
}

function changeSpeed() {
  const speeds = [0.5, 1, 2, 4, 8];
  const idx = speeds.indexOf(playSpeed);
  playSpeed = speeds[(idx + 1) % speeds.length];
  document.getElementById('speedLabel').textContent = playSpeed + 'x';
}

function seekProgress(e) {
  if (!replayData) return;
  const bar = document.getElementById('progressBar');
  const rect = bar.getBoundingClientRect();
  const pct = (e.clientX - rect.left) / rect.width;
  const targetIndex = Math.floor(pct * replayData.events.length);

  clearTimeout(playInterval);
  isPlaying = false;
  document.getElementById('playBtn').textContent = '▶️';

  resetState();
  replayIndex = 0;
  for (let i = 0; i < targetIndex && i < replayData.events.length; i++) {
    applyEvent(replayData.events[i], true);
    replayIndex++;
  }
  updateProgress();
}

function updateProgress() {
  if (!replayData) return;
  const pct = (replayIndex / replayData.events.length) * 100;
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('eventCounter').textContent = `${replayIndex}/${replayData.events.length}`;
}

function updatePlayerList() {
  const list = document.getElementById('playerList');
  if (!renderer.players) return;
  list.innerHTML = renderer.players.map(p => {
    const roleStr = p.role ? ` <span class="role-badge role-${p.role}">${p.role}</span>` : '';
    return `<li class="${p.alive ? '' : 'dead'}"><span class="player-dot ${p.alive ? '' : 'dead'}"></span>${p.name}${roleStr}</li>`;
  }).join('');
}

function updatePhaseBanner(event) {
  const banner = document.getElementById('phaseBanner');
  if (event.type === 'phase_change') {
    const phase = event.data.phase;
    banner.textContent = phase.toUpperCase() + (event.data.round ? ' — Round ' + event.data.round : '');
    banner.className = 'phase-banner phase-' + (phase === 'voting' || phase === 'resolution' ? 'voting' : phase);
  }
  if (event.type === 'game_over') {
    banner.textContent = 'GAME OVER — ' + (event.data.winner === 'citizens' ? '🛡️ CITIZENS WIN' : '🗡️ TRAITORS WIN');
    banner.className = 'phase-banner phase-voting';
  }
}

function addLogEntry(event) {
  const log = document.getElementById('gameLog');
  const entry = document.createElement('div');
  let cls = 'log-entry';
  let text = '';

  switch (event.type) {
    case 'game_start':
      cls += ' phase'; text = `🏛️ Game started with ${event.data.playerCount} agents`; break;
    case 'phase_change':
      cls += ' phase';
      if (event.data.phase === 'day') text = `☀️ Day ${event.data.round} begins`;
      else if (event.data.phase === 'night') text = `🌙 Night ${event.data.round} falls`;
      else if (event.data.phase === 'voting') text = `🗳️ Voting begins`;
      else if (event.data.phase === 'resolution') {
        text = event.data.eliminated ? `☠️ ${event.data.eliminated} eliminated (${event.data.role})` : `⚖️ No elimination`;
        cls += ' elimination';
      }
      break;
    case 'speech':
      cls += ' speech'; text = `💬 ${event.data.name}: "${event.data.content}"`; break;
    case 'vote_cast':
      cls += ' vote'; text = `🗳️ ${event.data.voterName} → ${event.data.targetName}`; break;
    case 'night_kill':
      cls += ' elimination';
      text = event.data.noKill ? '🌙 No kill tonight' : `🗡️ ${event.data.targetName} killed (${event.data.role})`;
      break;
    case 'elimination':
      cls += ' elimination'; text = `☠️ ${event.data.name} eliminated (${event.data.role})`; break;
    case 'game_over':
      cls += ' game-over';
      text = event.data.winner === 'citizens' ? '🏆 CITIZENS WIN!' : '🏆 TRAITORS WIN!';
      break;
    default: return;
  }

  entry.className = cls;
  entry.textContent = text;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}
