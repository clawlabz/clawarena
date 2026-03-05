#!/usr/bin/env node

import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { mkdir, readdir, readFile, rm, unlink, writeFile } from 'node:fs/promises'
import { closeSync, openSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'

const DEFAULT_BASE_URL = 'https://arena.clawlabz.xyz'
const DEFAULT_MODES = ['tribunal', 'texas_holdem']
const RUNNERS_DIR = process.env.ARENA_RUNNERS_DIR || '~/.openclaw/workspace/arena-runners'
const LEGACY_CREDENTIALS_PATH = process.env.ARENA_LEGACY_CREDENTIALS_PATH || '~/.openclaw/workspace/arena-credentials.json'
const RUNNER_SCHEMA_VERSION = 1

function usage() {
  process.stdout.write(`Usage:
  claw-arena-runner connect [--api-key <key> | --name <agent_name>] [--base-url <url>] [--modes <a,b>] [--label <local_name>]
  claw-arena-runner ls
  claw-arena-runner status [id|all]
  claw-arena-runner set modes <a,b> [id|all]
  claw-arena-runner pause [id|all]
  claw-arena-runner resume [id|all]
  claw-arena-runner stop [id|all]
  claw-arena-runner start <id|all>
  claw-arena-runner delete <id|all> [--yes]
  claw-arena-runner purge --yes

Notes:
  - connect always creates a NEW local instance.
  - if --api-key is omitted, --name is required and we register a new agent.
  - id supports exact or unique prefix.
`)
}

function splitModes(value) {
  if (!value) return []
  return String(value)
    .split(',')
    .map(mode => mode.trim())
    .filter(Boolean)
}

function resolveHomePath(inputPath) {
  if (!inputPath) return inputPath
  if (inputPath === '~') return os.homedir()
  if (inputPath.startsWith('~/')) return path.join(os.homedir(), inputPath.slice(2))
  return inputPath
}

function runnersDirPath() {
  return resolveHomePath(RUNNERS_DIR)
}

function legacyCredentialsPath() {
  return resolveHomePath(LEGACY_CREDENTIALS_PATH)
}

function runnerFilePath(id) {
  return path.join(runnersDirPath(), `${id}.json`)
}

function runnerLogPath(id) {
  return path.join(runnersDirPath(), `${id}.log`)
}

function nowIso() {
  return new Date().toISOString()
}

function createRunnerId() {
  const partA = Date.now().toString(36)
  const partB = Math.random().toString(36).slice(2, 8)
  return `ca_${partA}${partB}`
}

function maskApiKey(value) {
  const text = String(value || '')
  if (text.length <= 10) return text
  return `${text.slice(0, 6)}...${text.slice(-4)}`
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function parseNumber(value) {
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`)
}

async function ensureRunnersDir() {
  await mkdir(runnersDirPath(), { recursive: true, mode: 0o700 })
}

function normalizeRunnerRecord(raw) {
  if (!isObject(raw)) return null
  if (typeof raw.id !== 'string' || !raw.id) return null
  if (typeof raw.apiKey !== 'string' || !raw.apiKey) return null

  const status = raw.status === 'running' ? 'running' : 'stopped'
  const baseUrl = typeof raw.baseUrl === 'string' && raw.baseUrl ? raw.baseUrl : DEFAULT_BASE_URL
  const modes = Array.isArray(raw.modes)
    ? raw.modes.map(mode => String(mode || '').trim()).filter(Boolean)
    : DEFAULT_MODES
  const pid = parseNumber(raw.pid)

  return {
    schemaVersion: RUNNER_SCHEMA_VERSION,
    id: raw.id,
    localName: typeof raw.localName === 'string' && raw.localName ? raw.localName : raw.id,
    agentId: typeof raw.agentId === 'string' ? raw.agentId : '',
    agentName: typeof raw.agentName === 'string' ? raw.agentName : '',
    apiKey: raw.apiKey,
    apiKeyPreview: maskApiKey(raw.apiKey),
    baseUrl,
    modes,
    status,
    pid: pid !== null && pid > 0 ? Math.floor(pid) : null,
    createdAt: typeof raw.createdAt === 'string' && raw.createdAt ? raw.createdAt : nowIso(),
    updatedAt: typeof raw.updatedAt === 'string' && raw.updatedAt ? raw.updatedAt : nowIso(),
    lastStartAt: typeof raw.lastStartAt === 'string' ? raw.lastStartAt : null,
    lastStopAt: typeof raw.lastStopAt === 'string' ? raw.lastStopAt : null,
    source: raw.source === 'register' ? 'register' : 'api_key',
    logPath: typeof raw.logPath === 'string' && raw.logPath ? raw.logPath : runnerLogPath(raw.id),
  }
}

async function readRunnerRecord(id) {
  const file = runnerFilePath(id)
  const text = await readFile(file, 'utf8')
  const parsed = JSON.parse(text)
  const normalized = normalizeRunnerRecord(parsed)
  if (!normalized) {
    throw new Error(`Invalid runner record: ${file}`)
  }
  return normalized
}

async function writeRunnerRecord(record) {
  const normalized = normalizeRunnerRecord(record)
  if (!normalized) {
    throw new Error('Invalid runner record payload')
  }
  normalized.updatedAt = nowIso()
  await ensureRunnersDir()
  await writeFile(runnerFilePath(normalized.id), `${JSON.stringify(normalized, null, 2)}\n`, { mode: 0o600 })
  return normalized
}

async function listRunnerRecords() {
  await ensureRunnersDir()
  const files = await readdir(runnersDirPath())
  const records = []

  for (const file of files) {
    if (!file.endsWith('.json')) continue
    const id = file.slice(0, -5)
    try {
      const record = await readRunnerRecord(id)
      records.push(record)
    } catch {
      // Ignore broken runner files to keep CLI usable.
    }
  }

  records.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  return records
}

function isPidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

async function refreshRunnerState(record) {
  if (record.status !== 'running') return record
  if (record.pid && isPidAlive(record.pid)) return record

  const next = {
    ...record,
    status: 'stopped',
    pid: null,
    lastStopAt: nowIso(),
  }
  return writeRunnerRecord(next)
}

function resolveRunnerTarget(records, token) {
  if (!token || token === 'all') return records

  const exact = records.find(record => record.id === token)
  if (exact) return [exact]

  const prefixed = records.filter(record => record.id.startsWith(token))
  if (prefixed.length === 1) return prefixed
  if (prefixed.length > 1) {
    throw new Error(`Ambiguous id prefix '${token}', matches: ${prefixed.map(item => item.id).join(', ')}`)
  }

  throw new Error(`Runner not found: ${token}`)
}

async function requestArena({ baseUrl, apiKey }, method, reqPath, { body, expectedStatuses = [200] } = {}) {
  const url = new URL(reqPath, baseUrl).toString()
  const response = await fetch(url, {
    method,
    headers: {
      authorization: `Bearer ${apiKey}`,
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const text = await response.text()
  let data = {}
  if (text.trim()) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { raw: text }
    }
  }

  if (!expectedStatuses.includes(response.status)) {
    const message = typeof data?.error === 'string' ? data.error : `HTTP ${response.status} ${method} ${reqPath}`
    const error = new Error(message)
    error.status = response.status
    error.data = data
    throw error
  }

  return { status: response.status, data, headers: response.headers }
}

async function registerAgent({ baseUrl, name }) {
  const url = new URL('/api/agents/register', baseUrl).toString()
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  const data = await response.json().catch(() => ({}))

  if (response.status !== 201) {
    const message = typeof data?.error === 'string' ? data.error : `registration failed (${response.status})`
    throw new Error(message)
  }

  if (typeof data?.apiKey !== 'string' || !data.apiKey) {
    throw new Error('registration failed: apiKey missing in response')
  }

  return {
    apiKey: data.apiKey,
    agentId: typeof data?.agentId === 'string' ? data.agentId : '',
    name: typeof data?.name === 'string' && data.name ? data.name : name,
  }
}

async function loadAgentIdentity({ baseUrl, apiKey }) {
  const me = await requestArena({ baseUrl, apiKey }, 'GET', '/api/agents/me', { expectedStatuses: [200] })
  return {
    agentId: typeof me.data?.agentId === 'string' ? me.data.agentId : '',
    name: typeof me.data?.name === 'string' ? me.data.name : '',
  }
}

function getWorkerScriptPath() {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  return path.join(__dirname, 'arena-worker.mjs')
}

function launchWorker(record) {
  const args = [
    getWorkerScriptPath(),
    'start',
    '--api-key',
    record.apiKey,
    '--base-url',
    record.baseUrl,
  ]

  if (Array.isArray(record.modes) && record.modes.length > 0) {
    args.push('--modes', record.modes.join(','))
  }

  const fd = openSync(record.logPath, 'a')
  try {
    const child = spawn(process.execPath, args, {
      detached: true,
      stdio: ['ignore', fd, fd],
      env: process.env,
    })
    child.unref()
    return child.pid || null
  } finally {
    closeSync(fd)
  }
}

async function startRunner(record) {
  const current = await refreshRunnerState(record)
  if (current.status === 'running' && current.pid && isPidAlive(current.pid)) {
    return {
      ...current,
      alreadyRunning: true,
    }
  }

  const pid = launchWorker(current)
  if (!pid) {
    throw new Error(`failed to start runner ${current.id}`)
  }

  await sleep(120)

  const next = await writeRunnerRecord({
    ...current,
    status: 'running',
    pid,
    lastStartAt: nowIso(),
  })

  return {
    ...next,
    alreadyRunning: false,
  }
}

async function stopRunner(record, { forceKill = false } = {}) {
  const current = await refreshRunnerState(record)
  if (current.status !== 'running' || !current.pid) {
    return {
      ...current,
      stopped: false,
      reason: 'already_stopped',
    }
  }

  const pid = current.pid
  try {
    process.kill(pid, 'SIGTERM')
  } catch {
    const next = await writeRunnerRecord({
      ...current,
      status: 'stopped',
      pid: null,
      lastStopAt: nowIso(),
    })
    return {
      ...next,
      stopped: false,
      reason: 'not_running',
    }
  }

  const deadline = Date.now() + 4000
  while (Date.now() < deadline) {
    if (!isPidAlive(pid)) break
    await sleep(180)
  }

  let signal = 'SIGTERM'
  if (isPidAlive(pid) && forceKill) {
    try {
      process.kill(pid, 'SIGKILL')
      signal = 'SIGKILL'
    } catch {
      // ignore
    }
  }

  const next = await writeRunnerRecord({
    ...current,
    status: 'stopped',
    pid: null,
    lastStopAt: nowIso(),
  })

  return {
    ...next,
    stopped: true,
    signal,
  }
}

async function deleteRunner(record, { yes = false } = {}) {
  const current = await refreshRunnerState(record)
  if (current.status === 'running' && current.pid && !yes) {
    throw new Error(`runner ${current.id} is running, use --yes to stop and delete`)
  }

  if (current.status === 'running' && current.pid && yes) {
    await stopRunner(current, { forceKill: true })
  }

  await unlink(runnerFilePath(current.id)).catch(() => {})
  await unlink(current.logPath).catch(() => {})

  return { id: current.id, deleted: true }
}

function parseConnectArgs(args) {
  const options = {
    apiKey: process.env.ARENA_API_KEY || '',
    name: process.env.ARENA_AGENT_NAME || '',
    baseUrl: process.env.ARENA_BASE_URL || DEFAULT_BASE_URL,
    modes: splitModes(process.env.ARENA_MODES || DEFAULT_MODES.join(',')),
    label: '',
  }

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    const next = args[i + 1]

    if (arg === '--api-key') {
      if (!next) throw new Error('Missing value for --api-key')
      options.apiKey = next
      i += 1
      continue
    }
    if (arg === '--name') {
      if (!next) throw new Error('Missing value for --name')
      options.name = next
      i += 1
      continue
    }
    if (arg === '--base-url') {
      if (!next) throw new Error('Missing value for --base-url')
      options.baseUrl = next
      i += 1
      continue
    }
    if (arg === '--modes') {
      if (!next) throw new Error('Missing value for --modes')
      options.modes = splitModes(next)
      i += 1
      continue
    }
    if (arg === '--label') {
      if (!next) throw new Error('Missing value for --label')
      options.label = next
      i += 1
      continue
    }
    throw new Error(`Unknown argument: ${arg}`)
  }

  if (options.modes.length === 0) {
    options.modes = [...DEFAULT_MODES]
  }

  if (!options.apiKey && !options.name) {
    throw new Error('connect requires --api-key or --name (to auto-register)')
  }

  return options
}

async function commandConnect(args) {
  const options = parseConnectArgs(args)
  await ensureRunnersDir()

  let apiKey = options.apiKey
  let agentId = ''
  let agentName = options.name
  let source = 'api_key'
  let createdApiKey = null

  if (!apiKey) {
    if (!/^[a-zA-Z0-9_-]{3,32}$/.test(options.name)) {
      throw new Error('invalid --name, use 3-32 chars, letters/numbers/_/- only')
    }

    const registered = await registerAgent({
      baseUrl: options.baseUrl,
      name: options.name,
    })

    apiKey = registered.apiKey
    agentId = registered.agentId
    agentName = registered.name
    source = 'register'
    createdApiKey = registered.apiKey
  }

  const identity = await loadAgentIdentity({ baseUrl: options.baseUrl, apiKey })
  if (!agentId) agentId = identity.agentId
  if (!agentName) agentName = identity.name

  const id = createRunnerId()
  const logPath = runnerLogPath(id)
  const record = await writeRunnerRecord({
    schemaVersion: RUNNER_SCHEMA_VERSION,
    id,
    localName: options.label || agentName || id,
    agentId,
    agentName,
    apiKey,
    apiKeyPreview: maskApiKey(apiKey),
    baseUrl: options.baseUrl,
    modes: options.modes,
    status: 'stopped',
    pid: null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    lastStartAt: null,
    lastStopAt: null,
    source,
    logPath,
  })

  const started = await startRunner(record)

  printJson({
    ok: true,
    command: 'connect',
    instance: {
      id: started.id,
      localName: started.localName,
      agentId: started.agentId,
      agentName: started.agentName,
      source: started.source,
      baseUrl: started.baseUrl,
      modes: started.modes,
      pid: started.pid,
      status: started.status,
      logPath: started.logPath,
      apiKeyPreview: started.apiKeyPreview,
    },
    apiKey: createdApiKey,
    note: createdApiKey
      ? 'new API key created and shown once in this output'
      : 'used provided API key',
  })
}

async function commandList() {
  const records = await listRunnerRecords()
  const result = []

  for (const record of records) {
    const refreshed = await refreshRunnerState(record)
    result.push({
      id: refreshed.id,
      localName: refreshed.localName,
      agentName: refreshed.agentName,
      agentId: refreshed.agentId,
      modes: refreshed.modes,
      status: refreshed.status,
      pid: refreshed.pid,
      apiKeyPreview: refreshed.apiKeyPreview,
      createdAt: refreshed.createdAt,
      updatedAt: refreshed.updatedAt,
    })
  }

  printJson({
    ok: true,
    command: 'ls',
    total: result.length,
    instances: result,
  })
}

async function loadTargets(targetToken) {
  const records = await listRunnerRecords()
  if (records.length === 0) {
    throw new Error('no local ClawArena instances found')
  }
  return resolveRunnerTarget(records, targetToken)
}

async function commandStatus(targetToken) {
  const records = await listRunnerRecords()
  if (records.length === 0) {
    printJson({
      ok: true,
      command: 'status',
      count: 0,
      instances: [],
    })
    return
  }
  const targets = resolveRunnerTarget(records, targetToken)
  const results = []

  for (const target of targets) {
    const refreshed = await refreshRunnerState(target)
    try {
      const [runtime, queue] = await Promise.all([
        requestArena({ baseUrl: refreshed.baseUrl, apiKey: refreshed.apiKey }, 'GET', '/api/agents/runtime', { expectedStatuses: [200] }),
        requestArena({ baseUrl: refreshed.baseUrl, apiKey: refreshed.apiKey }, 'GET', '/api/queue/status', { expectedStatuses: [200] }),
      ])

      results.push({
        id: refreshed.id,
        localName: refreshed.localName,
        local: {
          status: refreshed.status,
          pid: refreshed.pid,
          modes: refreshed.modes,
          updatedAt: refreshed.updatedAt,
        },
        remote: {
          runtime: runtime.data?.runtime ?? null,
          preferences: runtime.data?.preferences ?? null,
          queue: queue.data ?? null,
        },
      })
    } catch (error) {
      results.push({
        id: refreshed.id,
        localName: refreshed.localName,
        local: {
          status: refreshed.status,
          pid: refreshed.pid,
          modes: refreshed.modes,
          updatedAt: refreshed.updatedAt,
        },
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  printJson({
    ok: true,
    command: 'status',
    count: results.length,
    instances: results,
  })
}

async function commandSetModes(modesValue, targetToken) {
  const modes = splitModes(modesValue)
  if (modes.length === 0) {
    throw new Error('set modes requires a non-empty mode list')
  }

  const targets = await loadTargets(targetToken)
  const results = []

  for (const target of targets) {
    const refreshed = await refreshRunnerState(target)
    try {
      await requestArena({ baseUrl: refreshed.baseUrl, apiKey: refreshed.apiKey }, 'POST', '/api/agents/preferences', {
        body: { enabledModes: modes },
        expectedStatuses: [200],
      })
      await requestArena({ baseUrl: refreshed.baseUrl, apiKey: refreshed.apiKey }, 'POST', '/api/queue/leave', {
        body: {},
        expectedStatuses: [200],
      })
      await requestArena({ baseUrl: refreshed.baseUrl, apiKey: refreshed.apiKey }, 'POST', '/api/agents/runtime/queue/ensure', {
        body: {},
        expectedStatuses: [200, 429, 503],
      })

      const saved = await writeRunnerRecord({
        ...refreshed,
        modes,
      })

      results.push({ id: saved.id, ok: true, modes: saved.modes })
    } catch (error) {
      results.push({ id: refreshed.id, ok: false, error: error instanceof Error ? error.message : String(error) })
    }
  }

  printJson({ ok: true, command: 'set modes', modes, results })
}

async function commandPause(targetToken) {
  const targets = await loadTargets(targetToken)
  const results = []

  for (const target of targets) {
    const refreshed = await refreshRunnerState(target)
    try {
      await requestArena({ baseUrl: refreshed.baseUrl, apiKey: refreshed.apiKey }, 'POST', '/api/agents/preferences', {
        body: { paused: true },
        expectedStatuses: [200],
      })
      await requestArena({ baseUrl: refreshed.baseUrl, apiKey: refreshed.apiKey }, 'POST', '/api/queue/leave', {
        body: {},
        expectedStatuses: [200],
      })
      results.push({ id: refreshed.id, ok: true })
    } catch (error) {
      results.push({ id: refreshed.id, ok: false, error: error instanceof Error ? error.message : String(error) })
    }
  }

  printJson({ ok: true, command: 'pause', results })
}

async function commandResume(targetToken) {
  const targets = await loadTargets(targetToken)
  const results = []

  for (const target of targets) {
    const refreshed = await refreshRunnerState(target)
    try {
      await requestArena({ baseUrl: refreshed.baseUrl, apiKey: refreshed.apiKey }, 'POST', '/api/agents/preferences', {
        body: { paused: false, autoQueue: true },
        expectedStatuses: [200],
      })
      const ensure = await requestArena({ baseUrl: refreshed.baseUrl, apiKey: refreshed.apiKey }, 'POST', '/api/agents/runtime/queue/ensure', {
        body: {},
        expectedStatuses: [200, 429, 503],
      })
      results.push({ id: refreshed.id, ok: true, ensureStatus: ensure.status, ensure: ensure.data })
    } catch (error) {
      results.push({ id: refreshed.id, ok: false, error: error instanceof Error ? error.message : String(error) })
    }
  }

  printJson({ ok: true, command: 'resume', results })
}

async function commandStop(targetToken) {
  const targets = await loadTargets(targetToken)
  const results = []

  for (const target of targets) {
    const stopped = await stopRunner(target, { forceKill: true })
    results.push({
      id: stopped.id,
      ok: true,
      status: stopped.status,
      pid: stopped.pid,
      reason: stopped.reason || null,
      signal: stopped.signal || null,
    })
  }

  printJson({ ok: true, command: 'stop', results })
}

async function commandStart(targetToken) {
  const targets = await loadTargets(targetToken)
  const results = []

  for (const target of targets) {
    const started = await startRunner(target)
    results.push({
      id: started.id,
      ok: true,
      status: started.status,
      pid: started.pid,
      alreadyRunning: started.alreadyRunning,
    })
  }

  printJson({ ok: true, command: 'start', results })
}

async function commandDelete(targetToken, yes) {
  const targets = await loadTargets(targetToken)
  const results = []

  for (const target of targets) {
    const deleted = await deleteRunner(target, { yes })
    results.push(deleted)
  }

  printJson({ ok: true, command: 'delete', results })
}

async function commandPurge(yes) {
  if (!yes) {
    throw new Error('purge is destructive, re-run with --yes')
  }

  const records = await listRunnerRecords()
  const stopped = []
  for (const record of records) {
    const result = await stopRunner(record, { forceKill: true })
    stopped.push({ id: result.id, signal: result.signal || null, reason: result.reason || null })
  }

  await rm(runnersDirPath(), { recursive: true, force: true })
  await unlink(legacyCredentialsPath()).catch(() => {})

  printJson({
    ok: true,
    command: 'purge',
    removedRunnerDir: runnersDirPath(),
    removedLegacyCredentials: legacyCredentialsPath(),
    stopped,
  })
}

async function main() {
  const argv = process.argv.slice(2)
  const command = argv[0]

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    usage()
    return
  }

  if (command === 'connect') {
    await commandConnect(argv.slice(1))
    return
  }

  if (command === 'ls' || command === 'list') {
    await commandList()
    return
  }

  if (command === 'status') {
    await commandStatus(argv[1] || 'all')
    return
  }

  if (command === 'set-modes') {
    const modesValue = argv[1]
    if (!modesValue) throw new Error('Usage: set-modes <a,b> [id|all]')
    await commandSetModes(modesValue, argv[2] || 'all')
    return
  }

  if (command === 'set') {
    if (argv[1] !== 'modes') throw new Error('Usage: set modes <a,b> [id|all]')
    const modesValue = argv[2]
    if (!modesValue) throw new Error('Usage: set modes <a,b> [id|all]')
    await commandSetModes(modesValue, argv[3] || 'all')
    return
  }

  if (command === 'pause') {
    await commandPause(argv[1] || 'all')
    return
  }

  if (command === 'resume') {
    await commandResume(argv[1] || 'all')
    return
  }

  if (command === 'stop') {
    await commandStop(argv[1] || 'all')
    return
  }

  if (command === 'start') {
    const hasConnectStyleFlag = argv.slice(1).some(arg => arg.startsWith('--'))
    if (hasConnectStyleFlag) {
      await commandConnect(argv.slice(1))
      return
    }
    const target = argv[1]
    if (!target) {
      throw new Error('Usage: start <id|all>  (or start --api-key/--name ... for new instance)')
    }
    await commandStart(target)
    return
  }

  if (command === 'delete') {
    const target = argv[1]
    if (!target) throw new Error('Usage: delete <id|all> [--yes]')
    const yes = argv.includes('--yes')
    await commandDelete(target, yes)
    return
  }

  if (command === 'purge') {
    await commandPurge(argv.includes('--yes'))
    return
  }

  throw new Error(`Unknown command: ${command}`)
}

main().catch(error => {
  process.stderr.write(`[runner-manager][fatal] ${error?.message || String(error)}\n`)
  process.exit(1)
})
