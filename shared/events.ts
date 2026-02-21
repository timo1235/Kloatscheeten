import type { GameState, Team } from './types'

export type GameErrorCode =
  | 'GAME_NOT_FOUND'
  | 'INVALID_TOKEN'
  | 'GAME_ALREADY_ENDED'
  | 'CANNOT_UNDO'
  | 'RATE_LIMITED'
  | 'INVALID_PLAYER'
  | 'TOO_MANY_PLAYERS'
  | 'TOO_FEW_PLAYERS'

export interface ClientToServerEvents {
  'game:join': (
    payload: { gameId: string },
    callback: (state: GameState | null) => void
  ) => void
  'game:throw': (payload: { gameId: string; team: Team }) => void
  'game:undo': (payload: { gameId: string }) => void
  'game:end': (payload: { gameId: string }) => void
  'game:leave': (payload: { gameId: string }) => void
  'game:addPlayer': (payload: { gameId: string; team: Team; name: string }) => void
  'game:removePlayer': (payload: { gameId: string; team: Team; index: number }) => void
  'game:reorderPlayers': (payload: { gameId: string; team: Team; newOrder: string[] }) => void
  'game:setThrower': (payload: { gameId: string; team: Team; index: number }) => void
}

export interface ServerToClientEvents {
  'game:updated': (state: GameState) => void
  'game:error': (error: { code: GameErrorCode; message: string }) => void
}

export interface InterServerEvents {}

export interface SocketData {
  gameId?: string
  isAdmin?: boolean
  adminGameId?: string
}
