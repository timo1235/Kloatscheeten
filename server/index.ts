import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { nanoid } from 'nanoid'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '@cloatscheeten/shared/events.ts'
import type { CreateGameRequest, CreateGameResponse, Team } from '@cloatscheeten/shared/types.ts'
import { createGame, getGame, validateAdminToken, recordThrow, undoThrow, endGame, addPlayer, removePlayer, reorderPlayers, setCurrentThrower } from './db.ts'

const PORT = parseInt(process.env.PORT ?? '12000', 10)
const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST = join(__dirname, 'frontend', 'dist')

// --- Rate limiting ---
function createRateLimiter(maxHits: number, windowMs: number) {
  const hits = new Map<string, number[]>()

  // Cleanup stale entries every 60s
  setInterval(() => {
    const cutoff = Date.now() - windowMs
    for (const [key, timestamps] of hits) {
      const valid = timestamps.filter((t) => t > cutoff)
      if (valid.length === 0) hits.delete(key)
      else hits.set(key, valid)
    }
  }, 60_000).unref()

  return {
    isLimited(key: string): boolean {
      const now = Date.now()
      const cutoff = now - windowMs
      const timestamps = (hits.get(key) ?? []).filter((t) => t > cutoff)
      if (timestamps.length >= maxHits) return true
      timestamps.push(now)
      hits.set(key, timestamps)
      return false
    },
    remove(key: string) {
      hits.delete(key)
    },
  }
}

const throwLimiter = createRateLimiter(10, 1_000)       // 10 throws/sec per IP
const gameCreateLimiter = createRateLimiter(5, 60_000)  // 5 games/min per IP
const joinLimiter = createRateLimiter(20, 60_000)       // 20 joins/min per IP

function getSocketIp(socket: any): string {
  return socket.handshake.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || socket.handshake.address
    || 'unknown'
}

// --- Express app ---
const app = express()
app.use(express.json({ limit: '16kb' }))

// Health
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Create game
const ALLOWED_COLORS = ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#e2e8f0']

app.post('/api/games', (req, res) => {
  const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown'
  if (gameCreateLimiter.isLimited(ip)) {
    res.status(429).json({ errors: ['Zu viele Spiele erstellt. Bitte warte eine Minute.'] })
    return
  }

  const body = req.body as CreateGameRequest

  const errors: string[] = []
  if (!body.teamAName?.trim() || body.teamAName.length > 50) errors.push('Team A name invalid')
  if (!body.teamBName?.trim() || body.teamBName.length > 50) errors.push('Team B name invalid')
  if (!Array.isArray(body.teamAPlayers) || body.teamAPlayers.length < 2 || body.teamAPlayers.length > 8)
    errors.push('Team A needs 2-8 players')
  if (!Array.isArray(body.teamBPlayers) || body.teamBPlayers.length < 2 || body.teamBPlayers.length > 8)
    errors.push('Team B needs 2-8 players')

  const allPlayers = [...(body.teamAPlayers ?? []), ...(body.teamBPlayers ?? [])]
  for (const name of allPlayers) {
    if (typeof name !== 'string' || !name.trim() || name.length > 50)
      errors.push(`Invalid player name: ${name}`)
  }

  const teamAColor = body.teamAColor || '#ef4444'
  const teamBColor = body.teamBColor || '#3b82f6'
  if (!ALLOWED_COLORS.includes(teamAColor)) errors.push('Invalid Team A color')
  if (!ALLOWED_COLORS.includes(teamBColor)) errors.push('Invalid Team B color')

  if (errors.length > 0) {
    res.status(400).json({ errors })
    return
  }

  const gameId = nanoid(6)
  const adminToken = nanoid(21)

  const trimmedAPlayers = body.teamAPlayers.map((n: string) => n.trim())
  const trimmedBPlayers = body.teamBPlayers.map((n: string) => n.trim())

  createGame(gameId, adminToken, body.teamAName.trim(), body.teamBName.trim(), trimmedAPlayers, trimmedBPlayers, teamAColor, teamBColor)

  const host = req.headers.host ?? `localhost:${PORT}`
  const protocol = req.headers['x-forwarded-proto'] ?? 'http'
  const viewerUrl = `${protocol}://${host}/game/${gameId}`

  const response: CreateGameResponse = { gameId, adminToken, viewerUrl }
  res.status(201).json(response)
})

// Get game
app.get('/api/games/:id', (req, res) => {
  const game = getGame(req.params.id)
  if (!game) {
    res.status(404).json({ error: 'Game not found' })
    return
  }
  res.json(game)
})

// Static files (Vue SPA)
app.use(express.static(DIST))
app.get('/{*path}', (_req, res) => {
  res.sendFile(join(DIST, 'index.html'))
})

// --- HTTP + Socket.io ---
const httpServer = createServer(app)

const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
  cors: { origin: false },
  maxHttpBufferSize: 16_384,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
  },
})

// Auth middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined
  if (token && typeof token === 'string') {
    socket.data.isAdmin = false
    socket.data.adminGameId = undefined
    ;(socket as any)._adminToken = token
  }
  next()
})

io.on('connection', (socket) => {
  socket.on('game:join', ({ gameId }, callback) => {
    if (!gameId || typeof gameId !== 'string') {
      callback(null)
      return
    }

    const ip = getSocketIp(socket)
    if (joinLimiter.isLimited(ip)) {
      socket.emit('game:error', { code: 'RATE_LIMITED', message: 'Zu viele Anfragen. Bitte warte.' })
      callback(null)
      return
    }

    const game = getGame(gameId)
    if (!game) {
      socket.emit('game:error', { code: 'GAME_NOT_FOUND', message: 'Spiel nicht gefunden' })
      callback(null)
      return
    }

    socket.join(gameId)
    socket.data.gameId = gameId

    // Check admin token
    const token = (socket as any)._adminToken as string | undefined
    if (token && validateAdminToken(gameId, token)) {
      socket.data.isAdmin = true
      socket.data.adminGameId = gameId
    }

    callback(game)
  })

  socket.on('game:throw', ({ gameId, team }) => {
    if (!socket.data.isAdmin || socket.data.adminGameId !== gameId) {
      socket.emit('game:error', { code: 'INVALID_TOKEN', message: 'Keine Admin-Berechtigung' })
      return
    }
    if (team !== 'a' && team !== 'b') return
    if (throwLimiter.isLimited(getSocketIp(socket))) {
      socket.emit('game:error', { code: 'RATE_LIMITED', message: 'Zu viele Würfe' })
      return
    }

    const game = getGame(gameId)
    if (!game || game.status === 'ended') {
      socket.emit('game:error', { code: 'GAME_ALREADY_ENDED', message: 'Spiel ist beendet' })
      return
    }

    const updated = recordThrow(gameId, team as Team)
    if (updated) io.to(gameId).emit('game:updated', updated)
  })

  socket.on('game:undo', ({ gameId }) => {
    if (!socket.data.isAdmin || socket.data.adminGameId !== gameId) {
      socket.emit('game:error', { code: 'INVALID_TOKEN', message: 'Keine Admin-Berechtigung' })
      return
    }

    const game = getGame(gameId)
    if (!game || game.status === 'ended') {
      socket.emit('game:error', { code: 'GAME_ALREADY_ENDED', message: 'Spiel ist beendet' })
      return
    }

    const updated = undoThrow(gameId)
    if (updated) {
      io.to(gameId).emit('game:updated', updated)
    } else {
      socket.emit('game:error', { code: 'CANNOT_UNDO', message: 'Nichts zum Rückgängig-Machen' })
    }
  })

  socket.on('game:end', ({ gameId }) => {
    if (!socket.data.isAdmin || socket.data.adminGameId !== gameId) {
      socket.emit('game:error', { code: 'INVALID_TOKEN', message: 'Keine Admin-Berechtigung' })
      return
    }

    const updated = endGame(gameId)
    if (updated) io.to(gameId).emit('game:updated', updated)
  })

  socket.on('game:addPlayer', ({ gameId, team, name }) => {
    if (!socket.data.isAdmin || socket.data.adminGameId !== gameId) {
      socket.emit('game:error', { code: 'INVALID_TOKEN', message: 'Keine Admin-Berechtigung' })
      return
    }
    if (team !== 'a' && team !== 'b') return
    if (!name || typeof name !== 'string' || !name.trim() || name.length > 50) {
      socket.emit('game:error', { code: 'INVALID_PLAYER', message: 'Ungültiger Spielername' })
      return
    }

    const game = getGame(gameId)
    if (!game || game.status === 'ended') {
      socket.emit('game:error', { code: 'GAME_ALREADY_ENDED', message: 'Spiel ist beendet' })
      return
    }

    const updated = addPlayer(gameId, team, name.trim())
    if (updated) {
      io.to(gameId).emit('game:updated', updated)
    } else {
      socket.emit('game:error', { code: 'TOO_MANY_PLAYERS', message: 'Maximal 8 Spieler pro Team' })
    }
  })

  socket.on('game:removePlayer', ({ gameId, team, index }) => {
    if (!socket.data.isAdmin || socket.data.adminGameId !== gameId) {
      socket.emit('game:error', { code: 'INVALID_TOKEN', message: 'Keine Admin-Berechtigung' })
      return
    }
    if (team !== 'a' && team !== 'b') return
    if (typeof index !== 'number') return

    const game = getGame(gameId)
    if (!game || game.status === 'ended') {
      socket.emit('game:error', { code: 'GAME_ALREADY_ENDED', message: 'Spiel ist beendet' })
      return
    }

    const updated = removePlayer(gameId, team, index)
    if (updated) {
      io.to(gameId).emit('game:updated', updated)
    } else {
      socket.emit('game:error', { code: 'TOO_FEW_PLAYERS', message: 'Mindestens 2 Spieler pro Team' })
    }
  })

  socket.on('game:reorderPlayers', ({ gameId, team, newOrder }) => {
    if (!socket.data.isAdmin || socket.data.adminGameId !== gameId) {
      socket.emit('game:error', { code: 'INVALID_TOKEN', message: 'Keine Admin-Berechtigung' })
      return
    }
    if (team !== 'a' && team !== 'b') return
    if (!Array.isArray(newOrder)) return

    const game = getGame(gameId)
    if (!game || game.status === 'ended') {
      socket.emit('game:error', { code: 'GAME_ALREADY_ENDED', message: 'Spiel ist beendet' })
      return
    }

    const updated = reorderPlayers(gameId, team, newOrder)
    if (updated) {
      io.to(gameId).emit('game:updated', updated)
    } else {
      socket.emit('game:error', { code: 'INVALID_PLAYER', message: 'Ungültige Spielerliste' })
    }
  })

  socket.on('game:setThrower', ({ gameId, team, index }) => {
    if (!socket.data.isAdmin || socket.data.adminGameId !== gameId) {
      socket.emit('game:error', { code: 'INVALID_TOKEN', message: 'Keine Admin-Berechtigung' })
      return
    }
    if (team !== 'a' && team !== 'b') return
    if (typeof index !== 'number') return

    const game = getGame(gameId)
    if (!game || game.status === 'ended') {
      socket.emit('game:error', { code: 'GAME_ALREADY_ENDED', message: 'Spiel ist beendet' })
      return
    }

    const updated = setCurrentThrower(gameId, team, index)
    if (updated) {
      io.to(gameId).emit('game:updated', updated)
    } else {
      socket.emit('game:error', { code: 'INVALID_PLAYER', message: 'Ungültiger Spieler-Index' })
    }
  })

  socket.on('game:leave', ({ gameId }) => {
    socket.leave(gameId)
  })
})

httpServer.listen(PORT, () => {
  console.log(`Kloatscheeten server running on port ${PORT}`)
})
