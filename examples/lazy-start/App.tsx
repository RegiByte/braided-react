import { useState } from 'react'
import { useResource } from './hooks'

function DatabaseView() {
  const database = useResource('database')
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const handleQuery = async () => {
    setLoading(true)
    const res = await database.query('SELECT * FROM users')
    setResult(JSON.stringify(res, null, 2))
    setLoading(false)
  }

  return (
    <div style={{ padding: '20px', border: '2px solid #3b82f6', borderRadius: '8px' }}>
      <h2>🗄️ Database</h2>
      <button
        onClick={handleQuery}
        disabled={loading}
        style={{
          padding: '10px 20px',
          cursor: loading ? 'not-allowed' : 'pointer',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          marginBottom: '10px',
        }}
      >
        {loading ? 'Querying...' : 'Run Query'}
      </button>
      {result && (
        <pre
          style={{
            backgroundColor: '#1f2937',
            color: '#10b981',
            padding: '15px',
            borderRadius: '4px',
            overflow: 'auto',
          }}
        >
          {result}
        </pre>
      )}
    </div>
  )
}

function CacheView() {
  const cache = useResource('cache')
  const [key, setKey] = useState('')
  const [value, setValue] = useState('')
  const [getResult, setGetResult] = useState<string>('')

  const handleSet = async () => {
    await cache.set(key, value)
    setKey('')
    setValue('')
  }

  const handleGet = async () => {
    const result = await cache.get(key)
    setGetResult(result ? JSON.stringify(result) : 'Not found')
  }

  return (
    <div style={{ padding: '20px', border: '2px solid #10b981', borderRadius: '8px' }}>
      <h2>💾 Cache</h2>
      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          placeholder="Key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          style={{ padding: '8px', marginRight: '10px' }}
        />
        <input
          type="text"
          placeholder="Value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={{ padding: '8px', marginRight: '10px' }}
        />
        <button
          onClick={handleSet}
          disabled={!key || !value}
          style={{
            padding: '8px 16px',
            cursor: !key || !value ? 'not-allowed' : 'pointer',
            marginRight: '10px',
          }}
        >
          Set
        </button>
        <button
          onClick={handleGet}
          disabled={!key}
          style={{
            padding: '8px 16px',
            cursor: !key ? 'not-allowed' : 'pointer',
          }}
        >
          Get
        </button>
      </div>
      {getResult && (
        <div style={{ padding: '10px', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>
          {getResult}
        </div>
      )}
    </div>
  )
}

export function App() {
  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🧶 Braided React - Lazy Start</h1>
      <p style={{ color: '#6b7280', marginBottom: '40px' }}>
        System started when component mounted. Check console for startup logs.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <DatabaseView />
        <CacheView />
      </div>

      <div
        style={{
          marginTop: '40px',
          padding: '20px',
          backgroundColor: '#fef3c7',
          borderRadius: '8px',
        }}
      >
        <h3 style={{ marginTop: 0 }}>💡 Notice:</h3>
        <ul style={{ marginBottom: 0 }}>
          <li>System started when this page loaded (check console)</li>
          <li>There was a loading screen while resources initialized</li>
          <li>System will NOT halt if you navigate away (by design)</li>
          <li>Perfect for route-based lazy loading</li>
        </ul>
      </div>
    </div>
  )
}


