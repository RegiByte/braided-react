/**
 * React Application - Role Switcher
 *
 * Demonstrates switching between host and player systems,
 * with the systems managed by singleton managers.
 */

import { useState, useEffect } from 'react'
import { hostSystemManager, playerSystemManager } from './managers'
import {
  HostSystemBridge,
  PlayerSystemBridge,
  useHostResource,
  usePlayerResource,
} from './hooks'
import type { StartedSystem } from 'braided-react'
import type { hostSystemConfig, playerSystemConfig } from './system'

type Role = 'host' | 'player' | null

/**
 * Host View Component
 */
function HostView() {
  const config = useHostResource('config')
  const sessionStore = useHostResource('sessionStore')
  const [, forceUpdate] = useState({})

  return (
    <div style={{ padding: '20px', border: '2px solid #3b82f6', borderRadius: '8px' }}>
      <h2>🎮 Host Mode</h2>
      <div style={{ marginBottom: '20px' }}>
        <p>
          <strong>Role:</strong> {config.role}
        </p>
        <p>
          <strong>Max Players:</strong> {config.maxPlayers}
        </p>
        <p>
          <strong>Connected:</strong>{' '}
          {sessionStore.state.connected ? '✅ Yes' : '❌ No'}
        </p>
        {sessionStore.state.sessionId && (
          <p>
            <strong>Session ID:</strong> {sessionStore.state.sessionId}
          </p>
        )}
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => {
            sessionStore.connect(`host-${Date.now()}`)
            forceUpdate({})
          }}
          disabled={sessionStore.state.connected}
          style={{
            padding: '10px 20px',
            cursor: sessionStore.state.connected ? 'not-allowed' : 'pointer',
            opacity: sessionStore.state.connected ? 0.5 : 1,
          }}
        >
          Start Session
        </button>
        <button
          onClick={() => {
            sessionStore.disconnect()
            forceUpdate({})
          }}
          disabled={!sessionStore.state.connected}
          style={{
            padding: '10px 20px',
            cursor: !sessionStore.state.connected ? 'not-allowed' : 'pointer',
            opacity: !sessionStore.state.connected ? 0.5 : 1,
          }}
        >
          End Session
        </button>
      </div>
    </div>
  )
}

/**
 * Player View Component
 */
function PlayerView() {
  const config = usePlayerResource('config')
  const sessionStore = usePlayerResource('sessionStore')
  const [, forceUpdate] = useState({})

  return (
    <div style={{ padding: '20px', border: '2px solid #10b981', borderRadius: '8px' }}>
      <h2>👤 Player Mode</h2>
      <div style={{ marginBottom: '20px' }}>
        <p>
          <strong>Role:</strong> {config.role}
        </p>
        <p>
          <strong>Player ID:</strong> {config.playerId}
        </p>
        <p>
          <strong>Connected:</strong>{' '}
          {sessionStore.state.connected ? '✅ Yes' : '❌ No'}
        </p>
        {sessionStore.state.sessionId && (
          <p>
            <strong>Session ID:</strong> {sessionStore.state.sessionId}
          </p>
        )}
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => {
            sessionStore.connect(`player-${Date.now()}`)
            forceUpdate({})
          }}
          disabled={sessionStore.state.connected}
          style={{
            padding: '10px 20px',
            cursor: sessionStore.state.connected ? 'not-allowed' : 'pointer',
            opacity: sessionStore.state.connected ? 0.5 : 1,
          }}
        >
          Join Session
        </button>
        <button
          onClick={() => {
            sessionStore.disconnect()
            forceUpdate({})
          }}
          disabled={!sessionStore.state.connected}
          style={{
            padding: '10px 20px',
            cursor: !sessionStore.state.connected ? 'not-allowed' : 'pointer',
            opacity: !sessionStore.state.connected ? 0.5 : 1,
          }}
        >
          Leave Session
        </button>
      </div>
    </div>
  )
}

/**
 * Role Selector Component
 */
function RoleSelector({
  onSelectRole,
}: {
  onSelectRole: (role: 'host' | 'player') => void
}) {
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h2>Select Your Role</h2>
      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '20px' }}>
        <button
          onClick={() => onSelectRole('host')}
          style={{
            padding: '20px 40px',
            fontSize: '18px',
            cursor: 'pointer',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
          }}
        >
          🎮 Host Game
        </button>
        <button
          onClick={() => onSelectRole('player')}
          style={{
            padding: '20px 40px',
            fontSize: '18px',
            cursor: 'pointer',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
          }}
        >
          👤 Join Game
        </button>
      </div>
    </div>
  )
}

/**
 * Main App Component
 */
export function App() {
  const [role, setRole] = useState<Role>(null)
  const [system, setSystem] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!role) {
      setSystem(null)
      return
    }

    setLoading(true)
    const manager = role === 'host' ? hostSystemManager : playerSystemManager

    manager
      .getSystem()
      .then((sys) => {
        setSystem(sys)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to start system:', err)
        setLoading(false)
      })
  }, [role])

  const handleReset = async () => {
    if (role === 'host') {
      await hostSystemManager.destroySystem()
    } else if (role === 'player') {
      await playerSystemManager.destroySystem()
    }
    setRole(null)
    setSystem(null)
  }

  if (!role) {
    return (
      <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <h1>🧶 Braided React - Singleton Manager</h1>
        <p style={{ color: '#6b7280', marginBottom: '40px' }}>
          Systems managed by module-level singletons. Switch roles and see how
          systems persist.
        </p>
        <RoleSelector onSelectRole={setRole} />
      </div>
    )
  }

  if (loading || !system) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Loading system...</h2>
      </div>
    )
  }

  const Bridge = role === 'host' ? HostSystemBridge : PlayerSystemBridge
  const View = role === 'host' ? HostView : PlayerView

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🧶 Braided React - Singleton Manager</h1>
      <p style={{ color: '#6b7280', marginBottom: '20px' }}>
        Current role: <strong>{role}</strong>
      </p>

      <Bridge system={system}>
        <View />
      </Bridge>

      <div style={{ marginTop: '20px' }}>
        <button
          onClick={handleReset}
          style={{
            padding: '10px 20px',
            cursor: 'pointer',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          Reset & Change Role
        </button>
      </div>

      <div
        style={{
          marginTop: '40px',
          padding: '20px',
          backgroundColor: '#fef3c7',
          borderRadius: '8px',
        }}
      >
        <h3 style={{ marginTop: 0 }}>💡 Try This:</h3>
        <ol style={{ marginBottom: 0 }}>
          <li>Select a role and interact with the system</li>
          <li>Open DevTools console to see system lifecycle logs</li>
          <li>Notice how the system persists even if you navigate away</li>
          <li>Click "Reset" to explicitly destroy the system</li>
        </ol>
      </div>
    </div>
  )
}


