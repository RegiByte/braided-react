/**
 * System Configurations - Host and Player
 *
 * This example shows how to manage multiple system configurations
 * (like host vs player in a multiplayer game).
 */

import { defineResource } from 'braided-react/braided'
import type { StartedResource } from 'braided-react'

/**
 * Config Resource - Different for host vs player
 */
export const hostConfigResource = defineResource({
  start: () => {
    console.log('⚙️  Host config starting...')
    return {
      role: 'host' as const,
      maxPlayers: 8,
      isHost: true,
    }
  },
  halt: () => {
    console.log('⚙️  Host config halting')
  },
})

export const playerConfigResource = defineResource({
  start: () => {
    console.log('⚙️  Player config starting...')
    return {
      role: 'player' as const,
      playerId: Math.random().toString(36).substring(7),
      isHost: false,
    }
  },
  halt: () => {
    console.log('⚙️  Player config halting')
  },
})

/**
 * Session Store - Depends on config
 */
export const sessionStoreResource = defineResource<{
  config: StartedResource<typeof hostConfigResource | typeof playerConfigResource>
}>({
  dependencies: ['config'],
  start: ({ config }) => {
    console.log(`📦 Session store starting (role: ${config.role})...`)
    const state = {
      connected: false,
      sessionId: null as string | null,
    }

    return {
      get state() {
        return { ...state }
      },
      connect(sessionId: string) {
        state.connected = true
        state.sessionId = sessionId
        console.log(`📦 Connected to session: ${sessionId}`)
      },
      disconnect() {
        state.connected = false
        state.sessionId = null
        console.log('📦 Disconnected from session')
      },
    }
  },
  halt: (store) => {
    console.log('📦 Session store halting')
    store.disconnect()
  },
})

/**
 * Host System Configuration
 */
export const hostSystemConfig = {
  config: hostConfigResource,
  sessionStore: sessionStoreResource,
}

/**
 * Player System Configuration
 */
export const playerSystemConfig = {
  config: playerConfigResource,
  sessionStore: sessionStoreResource,
}


