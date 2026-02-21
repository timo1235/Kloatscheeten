import Database from 'better-sqlite3'
import type { GameState, Team } from '@cloatscheeten/shared/types.ts'

interface GameRow {
  id: string
  admin_token: string
  team_a_name: string
  team_b_name: string
  team_a_throws: number
  team_b_throws: number
  team_a_players: string
  team_b_players: string
  team_a_current_thrower: number
  team_b_current_thrower: number
  last_throw_team: string | null
  status: string
  winner: string | null
  created_at: number
  updated_at: number
}

const DB_PATH = process.env.DB_PATH ?? './data/games.db'

// Ensure data directory exists
import { mkdirSync } from 'fs'
import { dirname } from 'path'
mkdirSync(dirname(DB_PATH), { recursive: true })

const db = new Database(DB_PATH)

db.pragma('journal_mode = WAL')
db.pragma('synchronous = NORMAL')
db.pragma('busy_timeout = 5000')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    admin_token TEXT NOT NULL,
    team_a_name TEXT NOT NULL,
    team_b_name TEXT NOT NULL,
    team_a_throws INTEGER NOT NULL DEFAULT 0,
    team_b_throws INTEGER NOT NULL DEFAULT 0,
    team_a_players TEXT NOT NULL,
    team_b_players TEXT NOT NULL,
    team_a_current_thrower INTEGER NOT NULL DEFAULT 0,
    team_b_current_thrower INTEGER NOT NULL DEFAULT 0,
    last_throw_team TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    winner TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  )
`)

const stmtInsertGame = db.prepare(`
  INSERT INTO games (id, admin_token, team_a_name, team_b_name, team_a_players, team_b_players)
  VALUES (?, ?, ?, ?, ?, ?)
`)

const stmtGetGame = db.prepare<GameRow, [string]>(
  'SELECT * FROM games WHERE id = ?'
)

const stmtRecordThrow = db.prepare(`
  UPDATE games SET
    team_a_throws = team_a_throws + CASE WHEN @team = 'a' THEN 1 ELSE 0 END,
    team_b_throws = team_b_throws + CASE WHEN @team = 'b' THEN 1 ELSE 0 END,
    team_a_current_thrower = CASE WHEN @team = 'a'
      THEN (team_a_current_thrower + 1) % json_array_length(team_a_players)
      ELSE team_a_current_thrower END,
    team_b_current_thrower = CASE WHEN @team = 'b'
      THEN (team_b_current_thrower + 1) % json_array_length(team_b_players)
      ELSE team_b_current_thrower END,
    last_throw_team = @team,
    updated_at = unixepoch()
  WHERE id = @id
`)

const stmtUndoThrow = db.prepare(`
  UPDATE games SET
    team_a_throws = team_a_throws - CASE WHEN last_throw_team = 'a' THEN 1 ELSE 0 END,
    team_b_throws = team_b_throws - CASE WHEN last_throw_team = 'b' THEN 1 ELSE 0 END,
    team_a_current_thrower = CASE WHEN last_throw_team = 'a'
      THEN (team_a_current_thrower - 1 + json_array_length(team_a_players)) % json_array_length(team_a_players)
      ELSE team_a_current_thrower END,
    team_b_current_thrower = CASE WHEN last_throw_team = 'b'
      THEN (team_b_current_thrower - 1 + json_array_length(team_b_players)) % json_array_length(team_b_players)
      ELSE team_b_current_thrower END,
    last_throw_team = NULL,
    updated_at = unixepoch()
  WHERE id = @id AND last_throw_team IS NOT NULL
`)

const stmtEndGame = db.prepare(`
  UPDATE games SET
    status = 'ended',
    winner = CASE
      WHEN team_a_throws < team_b_throws THEN 'a'
      WHEN team_b_throws < team_a_throws THEN 'b'
      ELSE NULL
    END,
    updated_at = unixepoch()
  WHERE id = @id AND status = 'active'
`)

function rowToGameState(row: GameRow): GameState {
  return {
    id: row.id,
    status: row.status as GameState['status'],
    winner: row.winner as GameState['winner'],
    lastThrowTeam: row.last_throw_team as GameState['lastThrowTeam'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    teamA: {
      name: row.team_a_name,
      throws: row.team_a_throws,
      players: JSON.parse(row.team_a_players),
      currentThrowerIndex: row.team_a_current_thrower,
    },
    teamB: {
      name: row.team_b_name,
      throws: row.team_b_throws,
      players: JSON.parse(row.team_b_players),
      currentThrowerIndex: row.team_b_current_thrower,
    },
  }
}

export function createGame(
  id: string,
  adminToken: string,
  teamAName: string,
  teamBName: string,
  teamAPlayers: string[],
  teamBPlayers: string[]
): GameState {
  stmtInsertGame.run(id, adminToken, teamAName, teamBName, JSON.stringify(teamAPlayers), JSON.stringify(teamBPlayers))
  return getGame(id)!
}

export function getGame(id: string): GameState | null {
  const row = stmtGetGame.get(id)
  return row ? rowToGameState(row) : null
}

export function validateAdminToken(gameId: string, token: string): boolean {
  const row = stmtGetGame.get(gameId)
  return row !== null && row.admin_token === token
}

export function recordThrow(gameId: string, team: Team): GameState | null {
  stmtRecordThrow.run({ id: gameId, team })
  return getGame(gameId)
}

export function undoThrow(gameId: string): GameState | null {
  const game = stmtGetGame.get(gameId)
  if (!game || !game.last_throw_team) return null
  stmtUndoThrow.run({ id: gameId })
  return getGame(gameId)
}

export function endGame(gameId: string): GameState | null {
  stmtEndGame.run({ id: gameId })
  return getGame(gameId)
}

const stmtAddPlayerA = db.prepare(`
  UPDATE games SET
    team_a_players = json_insert(team_a_players, '$[#]', @name),
    last_throw_team = NULL,
    updated_at = unixepoch()
  WHERE id = @id AND json_array_length(team_a_players) < 8
`)

const stmtAddPlayerB = db.prepare(`
  UPDATE games SET
    team_b_players = json_insert(team_b_players, '$[#]', @name),
    last_throw_team = NULL,
    updated_at = unixepoch()
  WHERE id = @id AND json_array_length(team_b_players) < 8
`)

export function addPlayer(gameId: string, team: Team, name: string): GameState | null {
  const stmt = team === 'a' ? stmtAddPlayerA : stmtAddPlayerB
  const result = stmt.run({ id: gameId, name })
  if (result.changes === 0) return null
  return getGame(gameId)
}

export function removePlayer(gameId: string, team: Team, index: number): GameState | null {
  const row = stmtGetGame.get(gameId)
  if (!row) return null

  const players: string[] = JSON.parse(team === 'a' ? row.team_a_players : row.team_b_players)
  if (players.length <= 2 || index < 0 || index >= players.length) return null

  const currentIndex = team === 'a' ? row.team_a_current_thrower : row.team_b_current_thrower
  players.splice(index, 1)

  // Adjust thrower index
  let newIndex = currentIndex
  if (index < currentIndex) {
    newIndex = currentIndex - 1
  } else if (index === currentIndex) {
    newIndex = currentIndex % players.length
  }
  if (newIndex >= players.length) newIndex = 0

  const stmt = team === 'a' ? stmtReorderPlayersA : stmtReorderPlayersB
  stmt.run({ id: gameId, players: JSON.stringify(players), throwerIndex: newIndex })
  return getGame(gameId)
}

const stmtReorderPlayersA = db.prepare(`
  UPDATE games SET
    team_a_players = @players,
    team_a_current_thrower = @throwerIndex,
    last_throw_team = NULL,
    updated_at = unixepoch()
  WHERE id = @id
`)

const stmtReorderPlayersB = db.prepare(`
  UPDATE games SET
    team_b_players = @players,
    team_b_current_thrower = @throwerIndex,
    last_throw_team = NULL,
    updated_at = unixepoch()
  WHERE id = @id
`)

export function reorderPlayers(gameId: string, team: Team, newOrder: string[]): GameState | null {
  const row = stmtGetGame.get(gameId)
  if (!row) return null

  const currentPlayers: string[] = JSON.parse(team === 'a' ? row.team_a_players : row.team_b_players)
  const currentIndex = team === 'a' ? row.team_a_current_thrower : row.team_b_current_thrower

  // Validate same players
  if (newOrder.length !== currentPlayers.length) return null
  const sorted1 = [...currentPlayers].sort()
  const sorted2 = [...newOrder].sort()
  if (sorted1.some((v, i) => v !== sorted2[i])) return null

  // Track current thrower by name
  const currentThrowerName = currentPlayers[currentIndex % currentPlayers.length]
  const newIndex = newOrder.indexOf(currentThrowerName)

  const stmt = team === 'a' ? stmtReorderPlayersA : stmtReorderPlayersB
  stmt.run({ id: gameId, players: JSON.stringify(newOrder), throwerIndex: newIndex >= 0 ? newIndex : 0 })
  return getGame(gameId)
}

const stmtSetThrowerA = db.prepare(`
  UPDATE games SET
    team_a_current_thrower = @index,
    last_throw_team = NULL,
    updated_at = unixepoch()
  WHERE id = @id
`)

const stmtSetThrowerB = db.prepare(`
  UPDATE games SET
    team_b_current_thrower = @index,
    last_throw_team = NULL,
    updated_at = unixepoch()
  WHERE id = @id
`)

export function setCurrentThrower(gameId: string, team: Team, index: number): GameState | null {
  const row = stmtGetGame.get(gameId)
  if (!row) return null

  const players: string[] = JSON.parse(team === 'a' ? row.team_a_players : row.team_b_players)
  if (index < 0 || index >= players.length) return null

  const stmt = team === 'a' ? stmtSetThrowerA : stmtSetThrowerB
  stmt.run({ id: gameId, index })
  return getGame(gameId)
}
