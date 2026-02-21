import { io, type Socket } from 'socket.io-client'
import { reactive, readonly } from 'vue'
import type { ServerToClientEvents, ClientToServerEvents } from '@cloatscheeten/shared/events'

type ClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>

let socket: ClientSocket | null = null

const state = reactive({
  connected: false,
  recovering: false,
})

export const connectionState = readonly(state)

export function getSocket(adminToken?: string | null): ClientSocket {
  if (socket) return socket

  socket = io({
    autoConnect: false,
    auth: adminToken ? { token: adminToken } : undefined,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 2000,
    reconnectionAttempts: Infinity,
  })

  socket.on('connect', () => {
    state.connected = true
    state.recovering = false
  })

  socket.on('disconnect', () => {
    state.connected = false
  })

  socket.on('connect_error', () => {
    state.recovering = true
  })

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
    state.connected = false
    state.recovering = false
  }
}
