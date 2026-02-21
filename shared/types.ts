export type Team = 'a' | 'b'
export type GameStatus = 'active' | 'ended'

export interface TeamState {
  name: string
  throws: number
  players: readonly string[]
  currentThrowerIndex: number
}

export interface GameState {
  id: string
  teamA: TeamState
  teamB: TeamState
  lastThrowTeam: Team | null
  status: GameStatus
  winner: Team | null
  createdAt: number
  updatedAt: number
}

export interface CreateGameRequest {
  teamAName: string
  teamBName: string
  teamAPlayers: string[]
  teamBPlayers: string[]
}

export interface CreateGameResponse {
  gameId: string
  adminToken: string
  viewerUrl: string
}

export function getCurrentThrower(team: TeamState): string {
  return team.players[team.currentThrowerIndex % team.players.length]
}

export function getLastThrowerIndex(team: TeamState): number {
  return (team.currentThrowerIndex - 1 + team.players.length) % team.players.length
}
