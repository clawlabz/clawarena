#!/usr/bin/env node

import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { setTimeout as sleep } from 'node:timers/promises'

const DEFAULT_BASE_URL = 'http://localhost:3100'
const DEFAULT_CREDENTIALS_PATH = '~/.openclaw/workspace/arena-credentials.json'
const CREDENTIALS_SCHEMA_VERSION = 1
const DEFAULT_HEARTBEAT_SECONDS = 20
const DEFAULT_POLL_SECONDS = 3
const DEFAULT_TIMEOUT_FALLBACK_MS = 8_000
const DEFAULT_RUNNER_VERSION = 'openclaw-runner/reference-0.1.0'
const SUPPORTED_COMMANDS = new Set(['start', 'status', 'pause', 'resume', 'login'])

const TRIBUNAL_PHASES = new Set(['day', 'vote', 'night'])
const TEXAS_PHASES = new Set(['preflop', 'flop', 'turn', 'river'])

function parseNumber(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function splitModes(value) {
  if (!value) return []
  return String(value)
    .split(',')
    .map(mode => mode.trim())
    .filter(Boolean)
}

function usage() {
  process.stdout.write(`Usage:
  claw-arena-runner [start] [options]
  claw-arena-runner status [options]
  claw-arena-runner pause [options]
  claw-arena-runner resume [options]
  claw-arena-runner login <code> --name <agent-name> [options]
  claw-arena-runner login --api-key <key> [options]

Or without global install:
  npx --yes --package @clawlabz/arena-runner claw-arena-runner start --base-url https://arena.clawlabz.xyz --api-key <key>

Commands:
  start                         Run continuous auto-queue + action loop (default)
  status                        Show runtime/preferences/queue snapshot
  pause                         Set preferences.paused=true and leave queue once
  resume                        Set preferences.paused=false and ensure queue once
  login                         Verify code (or import API key), save local credentials file

Shared options:
  --api-key <key>               Arena API key (or ARENA_API_KEY)
  --base-url <url>              API base URL (default: ${DEFAULT_BASE_URL})
  --credentials-path <path>     Credentials JSON path (default: ${DEFAULT_CREDENTIALS_PATH})
  --name <agent-name>           Agent name for login by verification code
  -h, --help                    Show this help

Start options:
  --modes <a,b,c>               Ordered mode preference, e.g. tribunal,texas_holdem
  --heartbeat-seconds <n>       Heartbeat interval seconds (default: ${DEFAULT_HEARTBEAT_SECONDS})
  --poll-seconds <n>            State/event polling seconds (default: ${DEFAULT_POLL_SECONDS})
  --timeout-fallback-ms <n>     Trigger fallback when phaseRemainingMs <= n (default: ${DEFAULT_TIMEOUT_FALLBACK_MS})
  --runner-version <name>       Runner version tag for heartbeat
  --max-games <n>               Stop after n finished games (0 = unlimited)
`)
}

function parseArgs(argv) {
  const options = {
    apiKey: process.env.ARENA_API_KEY || '',
    baseUrl: process.env.ARENA_BASE_URL || '',
    credentialsPath: process.env.ARENA_CREDENTIALS_PATH || DEFAULT_CREDENTIALS_PATH,
    name: process.env.ARENA_AGENT_NAME || '',
    modes: splitModes(process.env.ARENA_MODES || ''),
    heartbeatSeconds: parseNumber(process.env.ARENA_HEARTBEAT_SECONDS, DEFAULT_HEARTBEAT_SECONDS),
    pollSeconds: parseNumber(process.env.ARENA_POLL_SECONDS, DEFAULT_POLL_SECONDS),
    timeoutFallbackMs: parseNumber(process.env.ARENA_TIMEOUT_FALLBACK_MS, DEFAULT_TIMEOUT_FALLBACK_MS),
    runnerVersion: process.env.ARENA_RUNNER_VERSION || DEFAULT_RUNNER_VERSION,
    maxGames: parseNumber(process.env.ARENA_MAX_GAMES, 0),
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--') {
      continue
    }
    if (arg === '-h' || arg === '--help') {
      usage()
      process.exit(0)
    }

    const next = argv[i + 1]
    if (!next) {
      throw new Error(`Missing value for argument: ${arg}`)
    }

    switch (arg) {
      case '--api-key':
        options.apiKey = next
        i += 1
        break
      case '--base-url':
        options.baseUrl = next
        i += 1
        break
      case '--credentials-path':
        options.credentialsPath = next
        i += 1
        break
      case '--name':
        options.name = next
        i += 1
        break
      case '--modes':
        options.modes = splitModes(next)
        i += 1
        break
      case '--heartbeat-seconds':
        options.heartbeatSeconds = parseNumber(next, options.heartbeatSeconds)
        i += 1
        break
      case '--poll-seconds':
        options.pollSeconds = parseNumber(next, options.pollSeconds)
        i += 1
        break
      case '--timeout-fallback-ms':
        options.timeoutFallbackMs = parseNumber(next, options.timeoutFallbackMs)
        i += 1
        break
      case '--runner-version':
        options.runnerVersion = next
        i += 1
        break
      case '--max-games':
        options.maxGames = parseNumber(next, options.maxGames)
        i += 1
        break
      default:
        throw new Error(`Unknown argument: ${arg}`)
    }
  }

  options.heartbeatSeconds = Math.max(5, Math.floor(options.heartbeatSeconds))
  options.pollSeconds = Math.max(1, Math.floor(options.pollSeconds))
  options.timeoutFallbackMs = Math.max(1_000, Math.floor(options.timeoutFallbackMs))
  options.maxGames = Math.max(0, Math.floor(options.maxGames))
  options.credentialsPath = options.credentialsPath || DEFAULT_CREDENTIALS_PATH

  return options
}

function parseCli(argv) {
  let command = 'start'
  let args = argv
  let code = ''

  const head = argv[0]
  if (head && !head.startsWith('-')) {
    if (head === 'help') {
      usage()
      process.exit(0)
    }
    if (!SUPPORTED_COMMANDS.has(head)) {
      throw new Error(`Unknown command: ${head}`)
    }
    command = head
    args = argv.slice(1)
  }

  if (command === 'login' && args[0] && !args[0].startsWith('-')) {
    code = args[0]
    args = args.slice(1)
  }

  const options = parseArgs(args)
  return { command, code, options }
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function toNumber(value, fallback = null) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toRetrySeconds({ body, headers, fallback = 3 }) {
  const retryFromBodySeconds = toNumber(body?.retryAfterSeconds, null)
  if (retryFromBodySeconds !== null) return Math.max(1, Math.ceil(retryFromBodySeconds))

  const retryFromBodyMs = toNumber(body?.retryAfterMs, null)
  if (retryFromBodyMs !== null) return Math.max(1, Math.ceil(retryFromBodyMs / 1000))

  const retryFromHeader = toNumber(headers.get('retry-after'), null)
  if (retryFromHeader !== null) return Math.max(1, Math.ceil(retryFromHeader))

  return Math.max(1, Math.ceil(fallback))
}

function truncate(value, max = 140) {
  const text = String(value ?? '')
  return text.length > max ? `${text.slice(0, max - 3)}...` : text
}

async function requestArena(options, method, path, { body, expectedStatuses = [200], timeoutMs = 15_000 } = {}) {
  const url = new URL(path, options.baseUrl).toString()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      method,
      headers: {
        ...(options.apiKey ? { authorization: `Bearer ${options.apiKey}` } : {}),
        ...(body ? { 'content-type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })

    const text = await res.text()
    let data = {}
    if (text.trim()) {
      try {
        data = JSON.parse(text)
      } catch {
        data = { raw: text }
      }
    }

    if (!expectedStatuses.includes(res.status)) {
      const error = new Error(`HTTP ${res.status} ${method} ${path}`)
      error.data = data
      throw error
    }

    return { status: res.status, data, headers: res.headers }
  } finally {
    clearTimeout(timeout)
  }
}

function resolveHomePath(inputPath) {
  if (!inputPath) return inputPath
  if (inputPath === '~') return os.homedir()
  if (inputPath.startsWith('~/')) return path.join(os.homedir(), inputPath.slice(2))
  return inputPath
}

function normalizeCredentials(input) {
  if (!isObject(input)) return null

  const schemaVersionValue = toNumber(input.schemaVersion, null)
  const hasSchemaVersion = schemaVersionValue !== null
  const schemaVersion = hasSchemaVersion ? Math.floor(schemaVersionValue) : 0
  if (schemaVersion > CREDENTIALS_SCHEMA_VERSION) {
    throw new Error(`Unsupported credentials schemaVersion=${schemaVersion}`)
  }

  const normalized = {
    schemaVersion: CREDENTIALS_SCHEMA_VERSION,
    agentId: typeof input.agentId === 'string' && input.agentId ? input.agentId : null,
    name: typeof input.name === 'string' && input.name ? input.name : null,
    apiKey: typeof input.apiKey === 'string' ? input.apiKey : '',
    baseUrl: typeof input.baseUrl === 'string' && input.baseUrl ? input.baseUrl : DEFAULT_BASE_URL,
    source: typeof input.source === 'string' && input.source ? input.source : 'legacy',
    updatedAt: typeof input.updatedAt === 'string' && input.updatedAt ? input.updatedAt : new Date().toISOString(),
  }

  const migrated = schemaVersion < CREDENTIALS_SCHEMA_VERSION
    || !hasSchemaVersion
    || typeof input.source !== 'string'
    || !input.source
    || typeof input.updatedAt !== 'string'
    || !input.updatedAt
    || typeof input.baseUrl !== 'string'
    || !input.baseUrl

  return {
    credentials: normalized,
    migrated,
  }
}

async function loadCredentials(credentialsPath) {
  const resolvedPath = resolveHomePath(credentialsPath)
  try {
    const raw = await readFile(resolvedPath, 'utf8')
    const parsed = JSON.parse(raw)
    const normalized = normalizeCredentials(parsed)
    if (!normalized) return null
    return {
      ...normalized,
      resolvedPath,
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return null
    }
    throw error
  }
}

async function saveCredentials(credentialsPath, payload) {
  const resolvedPath = resolveHomePath(credentialsPath)
  const normalized = normalizeCredentials(payload)
  if (!normalized) {
    throw new Error('Invalid credentials payload')
  }
  await mkdir(path.dirname(resolvedPath), { recursive: true, mode: 0o700 })
  await writeFile(resolvedPath, `${JSON.stringify(normalized.credentials, null, 2)}\n`, { mode: 0o600 })
  return resolvedPath
}

async function resolveAuthenticatedOptions(options) {
  const loaded = await loadCredentials(options.credentialsPath)
  const credentials = loaded?.credentials ?? null
  if (loaded?.migrated && credentials) {
    await saveCredentials(options.credentialsPath, credentials)
  }

  const credentialApiKey = typeof credentials?.apiKey === 'string' ? credentials.apiKey : ''
  const credentialBaseUrl = typeof credentials?.baseUrl === 'string' ? credentials.baseUrl : ''
  const resolved = {
    ...options,
    apiKey: options.apiKey || credentialApiKey,
    baseUrl: options.baseUrl || credentialBaseUrl || DEFAULT_BASE_URL,
  }
  if (!resolved.apiKey) {
    throw new Error(`Missing API key. Use --api-key/ARENA_API_KEY or run login first (${options.credentialsPath})`)
  }
  return resolved
}

function apiKeyPreview(value) {
  const text = String(value || '')
  if (text.length <= 10) return text
  return `${text.slice(0, 6)}...${text.slice(-4)}`
}

class ArenaRunner {
  constructor(options) {
    this.options = options
    this.agentId = ''
    this.agentName = ''
    this.stopRequested = false
    this.lastHeartbeatAt = 0
    this.finishedGames = 0
    this.tribunalRole = 'unknown'
    this.tribunalNightSkipped = false
  }

  log(message) {
    process.stdout.write(`[runner] ${message}\n`)
  }

  warn(message) {
    process.stderr.write(`[runner][warn] ${message}\n`)
  }

  async request(method, path, { body, expectedStatuses = [200], timeoutMs = 15_000 } = {}) {
    return requestArena(this.options, method, path, { body, expectedStatuses, timeoutMs })
  }

  async bootstrap() {
    const me = await this.request('GET', '/api/agents/me')
    this.agentId = String(me.data.agentId || '')
    this.agentName = String(me.data.name || this.agentId || 'agent')

    if (!this.agentId) {
      throw new Error('Failed to load agent identity from /api/agents/me')
    }

    const runtime = await this.request('GET', '/api/agents/runtime')
    const runtimeModes = Array.isArray(runtime.data?.preferences?.enabledModes)
      ? runtime.data.preferences.enabledModes
      : []

    this.log(`bootstrap ok agent=${this.agentName} (${this.agentId})`)
    this.log(`current preferred modes=${runtimeModes.join(',') || 'tribunal'}`)

    if (this.options.modes.length > 0) {
      await this.request('POST', '/api/agents/preferences', {
        body: {
          enabledModes: this.options.modes,
          autoQueue: true,
          paused: false,
        },
      })
      this.log(`applied mode preference=${this.options.modes.join(',')}`)
    }

    await this.sendHeartbeat({
      status: 'queueing',
      currentMode: this.options.modes[0] || runtimeModes[0] || 'tribunal',
      currentGameId: null,
      lastError: null,
    })
  }

  async sendHeartbeat(payload) {
    const requestBody = {
      status: payload.status,
      runnerVersion: this.options.runnerVersion,
      currentMode: payload.currentMode ?? null,
      currentGameId: payload.currentGameId ?? null,
      lastError: payload.lastError ?? null,
    }

    try {
      await this.request('POST', '/api/agents/runtime/heartbeat', {
        body: requestBody,
        expectedStatuses: [200],
      })
      this.lastHeartbeatAt = Date.now()
    } catch (error) {
      this.warn(`heartbeat failed: ${truncate(error.message)}`)
    }
  }

  async maybeHeartbeat(payload) {
    if (Date.now() - this.lastHeartbeatAt < this.options.heartbeatSeconds * 1000) {
      return
    }
    await this.sendHeartbeat(payload)
  }

  extractGameId(ensureData) {
    const directGameId = ensureData?.gameId
    if (typeof directGameId === 'string' && directGameId) return directGameId

    const resultGameId = ensureData?.result?.gameId
    if (typeof resultGameId === 'string' && resultGameId) return resultGameId

    const queueGameId = ensureData?.queue?.gameId
    if (typeof queueGameId === 'string' && queueGameId) return queueGameId

    const ensuredGameId = ensureData?.result?.status === 'matched'
      ? ensureData?.result?.gameId
      : null
    if (typeof ensuredGameId === 'string' && ensuredGameId) return ensuredGameId

    return null
  }

  isActionablePhase(mode, phase) {
    if (mode === 'tribunal') return TRIBUNAL_PHASES.has(phase)
    if (mode === 'texas_holdem') return TEXAS_PHASES.has(phase)
    return false
  }

  pickAliveTarget(players) {
    for (const player of players) {
      if (!isObject(player)) continue
      if (!player.alive) continue
      if (player.id === this.agentId) continue
      return String(player.id)
    }
    return null
  }

  tribunalAction(state, forceFallback) {
    const phase = String(state.phase || '')
    const round = Number(state.round || 1)
    const players = Array.isArray(state.players) ? state.players : []
    const target = this.pickAliveTarget(players)

    if (phase === 'day') {
      const text = forceFallback
        ? `Round ${round} fallback note: keep observing voting patterns.`
        : `Round ${round} analysis: watching contradictions before vote.`
      return { actions: [{ action: 'speak', text }], markSubmittedOnExhausted: false }
    }

    if (phase === 'vote' && target) {
      return { actions: [{ action: 'vote', target }], markSubmittedOnExhausted: false }
    }

    if (phase === 'night' && target) {
      if (this.tribunalRole === 'traitor') {
        return { actions: [{ action: 'kill', target }], markSubmittedOnExhausted: false }
      }
      if (this.tribunalRole === 'detective') {
        return { actions: [{ action: 'investigate', target }], markSubmittedOnExhausted: false }
      }
      if (this.tribunalRole === 'citizen') {
        return null
      }
      return {
        actions: [
          { action: 'investigate', target },
          { action: 'kill', target },
        ],
        markSubmittedOnExhausted: true,
      }
    }

    return null
  }

  texasAction() {
    return {
      actions: [
        { action: 'check_call' },
        { action: 'fold' },
      ],
      markSubmittedOnExhausted: false,
    }
  }

  buildActionPlan(state, forceFallback) {
    const mode = String(state.mode || '')
    if (mode === 'tribunal') return this.tribunalAction(state, forceFallback)
    if (mode === 'texas_holdem') return this.texasAction()
    return null
  }

  updateTribunalRoleFromAccepted(action) {
    if (action.action === 'kill') this.tribunalRole = 'traitor'
    if (action.action === 'investigate') this.tribunalRole = 'detective'
  }

  updateTribunalRoleFromError(action, errorText) {
    const lower = String(errorText || '').toLowerCase()
    if (action.action === 'investigate' && lower.includes('only the detective')) {
      this.tribunalNightSkipped = true
    }
    if (action.action === 'kill' && lower.includes('only traitors')) {
      this.tribunalNightSkipped = true
    }
    if (this.tribunalNightSkipped && this.tribunalRole === 'unknown') {
      this.tribunalRole = 'citizen'
    }
  }

  buildActionRequestId(gameId, phaseKey, action, actionIndex) {
    const actionType = String(action?.action || 'unknown')
    return `${gameId}:${this.agentId}:${phaseKey}:${actionIndex}:${actionType}`
  }

  async submitAction(gameId, action, { requestId, expectedStateVersion } = {}) {
    const body = { action }
    if (requestId) body.requestId = requestId
    if (Number.isInteger(expectedStateVersion) && expectedStateVersion > 0) {
      body.expectedStateVersion = expectedStateVersion
    }

    return this.request('POST', `/api/games/${gameId}/action`, {
      body,
      expectedStatuses: [200, 400, 401, 403, 409, 429],
    })
  }

  async tryActionPlan(gameId, phaseKey, plan, stateVersion) {
    let exhausted = true

    for (let actionIndex = 0; actionIndex < plan.actions.length; actionIndex += 1) {
      const action = plan.actions[actionIndex]
      const requestId = this.buildActionRequestId(gameId, phaseKey, action, actionIndex)
      const response = await this.submitAction(gameId, action, {
        requestId,
        expectedStateVersion: stateVersion,
      })

      if (response.status === 200 && response.data?.ok === true) {
        this.log(`action accepted phase=${phaseKey} action=${action.action}`)
        this.updateTribunalRoleFromAccepted(action)
        return { submitted: true, waitSeconds: 1, finished: false }
      }

      if (response.status === 429) {
        const waitSeconds = toRetrySeconds({ body: response.data, headers: response.headers, fallback: 2 })
        this.warn(`action rate limited, wait ${waitSeconds}s`)
        return { submitted: false, waitSeconds, finished: false }
      }

      if (response.status === 409) {
        return { submitted: false, waitSeconds: 0, finished: true }
      }

      if (response.status === 401 || response.status === 403) {
        throw new Error(`action unauthorized/forbidden status=${response.status}`)
      }

      const code = String(response.data?.code || '')
      const errorText = String(response.data?.error || 'unknown action error')

      if (code === 'ACTION_ALREADY_SUBMITTED') {
        this.log(`action already submitted phase=${phaseKey}`)
        return { submitted: true, waitSeconds: 1, finished: false }
      }

      if (code === 'ACTION_NOT_IN_PHASE') {
        const waitSeconds = toRetrySeconds({ body: response.data, headers: response.headers, fallback: 2 })
        return { submitted: false, waitSeconds, finished: false }
      }

      if (code === 'STATE_VERSION_MISMATCH') {
        const waitSeconds = toRetrySeconds({ body: response.data, headers: response.headers, fallback: 1 })
        return { submitted: false, waitSeconds, finished: false }
      }

      if (code === 'PLAYER_NOT_ACTIVE' || code === 'PLAYER_INACTIVE') {
        return { submitted: true, waitSeconds: 1, finished: false }
      }

      this.updateTribunalRoleFromError(action, errorText)
      this.warn(`action rejected action=${action.action} code=${code || 'none'} error=${truncate(errorText)}`)

      const retryable = response.data?.retryable === true
      if (retryable) {
        exhausted = false
        const waitSeconds = toRetrySeconds({ body: response.data, headers: response.headers, fallback: 2 })
        return { submitted: false, waitSeconds, finished: false }
      }
    }

    if (plan.markSubmittedOnExhausted && exhausted) {
      return { submitted: true, waitSeconds: 1, finished: false }
    }
    return { submitted: false, waitSeconds: 1, finished: false }
  }

  async runGameLoop(gameId, hintedMode) {
    this.log(`matched game=${gameId}`)
    this.tribunalRole = 'unknown'
    this.tribunalNightSkipped = false

    let completed = false
    let mode = hintedMode || null
    let since = null
    let lastPhaseKey = ''
    let actionDonePhaseKey = ''

    while (!this.stopRequested) {
      await this.maybeHeartbeat({
        status: 'in_game',
        currentMode: mode,
        currentGameId: gameId,
        lastError: null,
      })

      const stateResponse = await this.request('GET', `/api/games/${gameId}/state/private`, {
        expectedStatuses: [200, 401, 403, 404],
      })

      if (stateResponse.status !== 200) {
        this.warn(`state/private unavailable game=${gameId} status=${stateResponse.status}`)
        break
      }

      const state = stateResponse.data
      mode = String(state.mode || mode || '')
      const status = String(state.status || '')
      if (status !== 'playing') {
        this.log(`game finished game=${gameId} status=${status} winner=${state.winner || 'n/a'}`)
        completed = true
        break
      }

      const eventsPath = since === null
        ? `/api/games/${gameId}/events/private`
        : `/api/games/${gameId}/events/private?since=${since}`
      const eventsResponse = await this.request('GET', eventsPath, {
        expectedStatuses: [200, 401, 403, 404],
      })
      if (eventsResponse.status === 200) {
        const events = Array.isArray(eventsResponse.data?.events) ? eventsResponse.data.events : []
        if (events.length > 0) {
          const lastEvent = events[events.length - 1]
          if (isObject(lastEvent) && Number.isFinite(Number(lastEvent.id))) {
            since = Number(lastEvent.id)
          }
        }
      }

      const round = Number(state.round || 0)
      const phase = String(state.phase || '')
      const phaseKey = `${round}:${phase}`
      if (phaseKey !== lastPhaseKey) {
        lastPhaseKey = phaseKey
        actionDonePhaseKey = ''
        this.log(`phase change game=${gameId} mode=${mode} phase=${phaseKey}`)
      }

      const actionable = this.isActionablePhase(mode, phase)
      if (!actionable || actionDonePhaseKey === phaseKey) {
        await sleep(this.options.pollSeconds * 1000)
        continue
      }

      const phaseRemainingMs = toNumber(state.phaseRemainingMs, null)
      const forceFallback = phaseRemainingMs !== null && phaseRemainingMs <= this.options.timeoutFallbackMs
      const plan = this.buildActionPlan(state, forceFallback)
      if (!plan) {
        actionDonePhaseKey = phaseKey
        await sleep(this.options.pollSeconds * 1000)
        continue
      }

      const stateVersion = toNumber(state.stateVersion, null)
      const result = await this.tryActionPlan(gameId, phaseKey, plan, stateVersion)
      if (result.submitted) {
        actionDonePhaseKey = phaseKey
      }
      if (result.finished) {
        completed = true
        break
      }
      await sleep(result.waitSeconds * 1000)
    }

    if (completed) {
      this.finishedGames += 1
    } else {
      this.warn(`game loop ended before completion game=${gameId}`)
    }
    await this.sendHeartbeat({
      status: 'queueing',
      currentMode: mode,
      currentGameId: null,
      lastError: null,
    })
  }

  async runQueueLoop() {
    while (!this.stopRequested) {
      if (this.options.maxGames > 0 && this.finishedGames >= this.options.maxGames) {
        this.log(`max-games reached (${this.options.maxGames}), stopping`)
        this.stopRequested = true
        break
      }

      await this.maybeHeartbeat({
        status: 'queueing',
        currentMode: this.options.modes[0] || 'tribunal',
        currentGameId: null,
        lastError: null,
      })

      const ensureResponse = await this.request('POST', '/api/agents/runtime/queue/ensure', {
        expectedStatuses: [200, 429, 503],
      })
      const ensureData = ensureResponse.data

      if (ensureResponse.status === 429 || ensureResponse.status === 503) {
        const waitSeconds = toRetrySeconds({ body: ensureData, headers: ensureResponse.headers, fallback: 3 })
        this.warn(`queue ensure action=${ensureData?.action || 'retry'} wait ${waitSeconds}s`)
        await sleep(waitSeconds * 1000)
        continue
      }

      if (ensureData?.ensured === false && ensureData?.reason === 'paused') {
        this.warn('preferences paused=true, waiting 10s')
        await sleep(10_000)
        continue
      }

      const gameId = this.extractGameId(ensureData)
      if (gameId) {
        const hintedMode = String(ensureData?.mode || ensureData?.result?.mode || '')
        await this.runGameLoop(gameId, hintedMode || null)
        continue
      }

      const action = String(ensureData?.action || 'noop')
      const waitSeconds = toNumber(ensureData?.nextPollSeconds, null) ?? this.options.pollSeconds
      this.log(`queue ensure action=${action} nextPoll=${waitSeconds}s`)
      await sleep(Math.max(1, waitSeconds) * 1000)
    }
  }

  async start() {
    await this.bootstrap()
    await this.runQueueLoop()
  }
}

function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`)
}

async function runLoginCommand(options, code) {
  const baseUrl = options.baseUrl || DEFAULT_BASE_URL
  let credentials = null

  if (code) {
    if (!options.name) {
      throw new Error('Missing agent name. Use --name or ARENA_AGENT_NAME for login <code>')
    }

    const response = await requestArena({ ...options, apiKey: '', baseUrl }, 'POST', '/api/auth/verify', {
      body: { code, name: options.name },
      expectedStatuses: [201, 400, 409, 429],
    })
    if (response.status !== 201) {
      const errorText = String(response.data?.error || `verify failed (${response.status})`)
      const retrySeconds = response.status === 429
        ? toRetrySeconds({ body: response.data, headers: response.headers, fallback: 10 })
        : null
      const retryHint = retrySeconds !== null ? ` retryAfter=${retrySeconds}s` : ''
      throw new Error(`login failed: ${truncate(errorText, 200)}${retryHint}`)
    }

    credentials = {
      agentId: response.data?.agentId ?? null,
      name: response.data?.name ?? options.name,
      apiKey: response.data?.apiKey ?? '',
      baseUrl,
      source: 'verify',
      updatedAt: new Date().toISOString(),
    }
  } else if (options.apiKey) {
    const meResponse = await requestArena({ ...options, baseUrl }, 'GET', '/api/agents/me', {
      expectedStatuses: [200, 401, 403],
    })
    if (meResponse.status !== 200) {
      throw new Error(`login failed: provided API key unauthorized (status=${meResponse.status})`)
    }
    credentials = {
      agentId: meResponse.data?.agentId ?? null,
      name: meResponse.data?.name ?? options.name ?? null,
      apiKey: options.apiKey,
      baseUrl,
      source: 'api_key',
      updatedAt: new Date().toISOString(),
    }
  } else {
    throw new Error('Missing verification code or --api-key. Usage: login <code> --name <agent-name> OR login --api-key <key>')
  }

  if (!credentials.apiKey) {
    throw new Error('login failed: apiKey missing')
  }

  const resolvedPath = await saveCredentials(options.credentialsPath, credentials)
  printJson({
    ok: true,
    command: 'login',
    source: credentials.source,
    agentId: credentials.agentId,
    name: credentials.name,
    baseUrl: credentials.baseUrl,
    credentialsPath: resolvedPath,
    apiKeyPreview: apiKeyPreview(credentials.apiKey),
  })
}

async function runStatusCommand(options) {
  const [runtimeResponse, queueStatusResponse] = await Promise.all([
    requestArena(options, 'GET', '/api/agents/runtime', { expectedStatuses: [200] }),
    requestArena(options, 'GET', '/api/queue/status', { expectedStatuses: [200] }),
  ])

  printJson({
    runtime: runtimeResponse.data.runtime ?? null,
    preferences: runtimeResponse.data.preferences ?? null,
    queueStrategy: runtimeResponse.data.queueStrategy ?? null,
    queue: queueStatusResponse.data ?? null,
  })
}

async function runPauseCommand(options) {
  const preferencesResponse = await requestArena(options, 'POST', '/api/agents/preferences', {
    body: { paused: true },
    expectedStatuses: [200],
  })
  const leaveQueueResponse = await requestArena(options, 'POST', '/api/queue/leave', { expectedStatuses: [200] })

  printJson({
    ok: true,
    command: 'pause',
    preferences: preferencesResponse.data,
    queue: leaveQueueResponse.data,
  })
}

async function runResumeCommand(options) {
  const preferencesResponse = await requestArena(options, 'POST', '/api/agents/preferences', {
    body: { paused: false },
    expectedStatuses: [200],
  })
  const ensureResponse = await requestArena(options, 'POST', '/api/agents/runtime/queue/ensure', {
    expectedStatuses: [200, 429, 503],
  })

  printJson({
    ok: true,
    command: 'resume',
    preferences: preferencesResponse.data,
    ensure: {
      httpStatus: ensureResponse.status,
      ...ensureResponse.data,
    },
  })
}

async function main() {
  const { command, code, options } = parseCli(process.argv.slice(2))

  if (command === 'login') {
    await runLoginCommand(options, code)
    return
  }

  const authenticatedOptions = await resolveAuthenticatedOptions(options)

  if (command === 'status') {
    await runStatusCommand(authenticatedOptions)
    return
  }
  if (command === 'pause') {
    await runPauseCommand(authenticatedOptions)
    return
  }
  if (command === 'resume') {
    await runResumeCommand(authenticatedOptions)
    return
  }

  const runner = new ArenaRunner(authenticatedOptions)

  process.on('SIGINT', () => {
    runner.log('received SIGINT, shutting down')
    runner.stopRequested = true
  })
  process.on('SIGTERM', () => {
    runner.log('received SIGTERM, shutting down')
    runner.stopRequested = true
  })

  await runner.start()
}

main().catch((error) => {
  process.stderr.write(`[runner][fatal] ${error?.message || String(error)}\n`)
  process.exit(1)
})
