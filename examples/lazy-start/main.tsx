import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LazySystemBridge } from 'braided-react'
import { systemConfig } from './system'
import { SystemBridge } from './hooks'
import { App } from './App'

function LoadingScreen() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
      }}
    >
      <h1>🧶 Starting System...</h1>
      <p style={{ color: '#6b7280' }}>
        Connecting to database and cache...
      </p>
      <div
        style={{
          width: '200px',
          height: '4px',
          backgroundColor: '#e5e7eb',
          borderRadius: '2px',
          overflow: 'hidden',
          marginTop: '20px',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#3b82f6',
            animation: 'loading 1.5s ease-in-out infinite',
          }}
        />
      </div>
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LazySystemBridge
      config={systemConfig}
      SystemBridge={SystemBridge}
      fallback={<LoadingScreen />}
      onStarted={(system) => {
        console.log('✅ System fully started:', system)
      }}
      onError={(errors) => {
        console.error('❌ System startup errors:', errors)
      }}
    >
      <App />
    </LazySystemBridge>
  </StrictMode>
)


