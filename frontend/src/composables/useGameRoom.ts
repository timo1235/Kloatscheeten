import { ref, computed, onMounted, onUnmounted, type Ref, type ComputedRef } from 'vue'
import type { GameState, Team } from '@cloatscheeten/shared/types'
import type { GameErrorCode } from '@cloatscheeten/shared/events'
import { getSocket, connectionState, disconnectSocket } from '@/socket'

interface UseGameRoomReturn {
  gameState: Ref<GameState | null>
  isConnected: ComputedRef<boolean>
  isRecovering: ComputedRef<boolean>
  isAdmin: Ref<boolean>
  isLoading: Ref<boolean>
  notFound: Ref<boolean>
  lastError: Ref<{ code: GameErrorCode; message: string } | null>
  pendingThrow: Ref<boolean>
  throwForTeam: (team: Team) => void
  undoLastThrow: () => void
  endGame: () => void
  addPlayer: (team: Team, name: string) => void
  removePlayer: (team: Team, index: number) => void
  reorderPlayers: (team: Team, newOrder: string[]) => void
  setThrower: (team: Team, index: number) => void
}

export function useGameRoom(gameId: string): UseGameRoomReturn {
  const adminToken = localStorage.getItem(`adminToken:${gameId}`)
  const socket = getSocket(adminToken)

  const gameState = ref<GameState | null>(null)
  const isAdmin = ref(false)
  const isLoading = ref(true)
  const notFound = ref(false)
  const lastError = ref<{ code: GameErrorCode; message: string } | null>(null)
  const pendingThrow = ref(false)

  const isConnected = computed(() => connectionState.connected)
  const isRecovering = computed(() => connectionState.recovering)

  function joinRoom() {
    socket.emit('game:join', { gameId }, (state) => {
      if (state) {
        gameState.value = state
        isAdmin.value = !!adminToken
        notFound.value = false
      } else {
        notFound.value = true
      }
      isLoading.value = false
    })
  }

  const handleUpdated = (state: GameState) => {
    gameState.value = state
    pendingThrow.value = false
    // Clear error on successful update
    lastError.value = null
  }

  const handleError = (error: { code: GameErrorCode; message: string }) => {
    lastError.value = error
    pendingThrow.value = false
    // Auto-clear error after 3 seconds
    setTimeout(() => {
      if (lastError.value?.code === error.code) lastError.value = null
    }, 3000)
  }

  const handleConnect = () => {
    if (!(socket as any).recovered) {
      joinRoom()
    }
  }

  function throwForTeam(team: Team) {
    if (pendingThrow.value || !isAdmin.value) return
    pendingThrow.value = true
    socket.emit('game:throw', { gameId, team })
  }

  function undoLastThrow() {
    if (pendingThrow.value || !isAdmin.value) return
    pendingThrow.value = true
    socket.emit('game:undo', { gameId })
  }

  function endGame() {
    if (!isAdmin.value) return
    socket.emit('game:end', { gameId })
  }

  function addPlayer(team: Team, name: string) {
    if (!isAdmin.value) return
    socket.emit('game:addPlayer', { gameId, team, name })
  }

  function removePlayer(team: Team, index: number) {
    if (!isAdmin.value) return
    socket.emit('game:removePlayer', { gameId, team, index })
  }

  function reorderPlayers(team: Team, newOrder: string[]) {
    if (!isAdmin.value) return
    socket.emit('game:reorderPlayers', { gameId, team, newOrder })
  }

  function setThrower(team: Team, index: number) {
    if (!isAdmin.value) return
    socket.emit('game:setThrower', { gameId, team, index })
  }

  onMounted(() => {
    socket.on('game:updated', handleUpdated)
    socket.on('game:error', handleError)
    socket.on('connect', handleConnect)

    socket.connect()
    joinRoom()
  })

  onUnmounted(() => {
    socket.off('game:updated', handleUpdated)
    socket.off('game:error', handleError)
    socket.off('connect', handleConnect)
    socket.emit('game:leave', { gameId })
    disconnectSocket()
  })

  return {
    gameState,
    isConnected,
    isRecovering,
    isAdmin,
    isLoading,
    notFound,
    lastError,
    pendingThrow,
    throwForTeam,
    undoLastThrow,
    endGame,
    addPlayer,
    removePlayer,
    reorderPlayers,
    setThrower,
  }
}
