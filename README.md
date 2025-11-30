# 🧶 Braided React

> **React integration for [Braided](https://github.com/RegiByte/braided) - Bridge your stateful systems to React without giving up lifecycle control.**

React observes your system. React doesn't own it.

## Why Braided React?

Modern React apps often need to manage complex, long-lived resources that don't fit neatly into the react component lifecycle:

- **WebSockets & Real-time Feeds** (Chat, Multiplayer Games)
- **Audio/Video Contexts** (WebRTC, Music Apps)
- **Complex API Clients** (Authentication, Retries, Caching)
- **Game Loops & Simulations**

Managing these inside `useEffect` often leads to "dependency hell," double-initialization in StrictMode, and race conditions.

**Braided React** solves this by letting you define your system *outside* React, and then bridging it *into* React as a fully-typed dependency injection layer.

## Features

- 🔌 **Dependency Injection:** Inject complex resources into any component.
- 🛡️ **Lifecycle Safety:** Resources survive remounts and StrictMode.
- 🎯 **Type Safety:** Fully inferred types from your system config to your hooks.
- 🧩 **Observer Pattern:** React components observe the system; they don't drive it.
- ⚡ **Low-Cost Abstraction:** Just a thin wrapper around React Context.

## Installation

```bash
npm install braided-react braided
```

Peer dependencies: `react >= 18.0.0` and `braided >= 0.0.4`

## Quick Start

### 1. Define Your System (outside React)

```typescript
// system.ts
import { defineResource } from 'braided'
import { createSystemHooks } from 'braided-react'

// A simple logger resource
const logger = defineResource({
  start: () => ({
    log: (msg: string) => console.log(`[Log]: ${msg}`)
  })
})

// An API client resource that depends on logger
const apiClient = defineResource({
  dependencies: ['logger'],
  start: ({ logger }) => ({
    fetchUser: async (id: string) => {
      logger.log(`Fetching user: ${id}`)
      return fetch(`/api/users/${id}`).then(r => r.json())
    }
  })
})

export const systemConfig = { logger, apiClient }

// Create your typed hooks!
export const { SystemBridge, useResource } = createSystemHooks<typeof systemConfig>()
```

### 2. Initialize & Bridge

```typescript
// main.tsx
import { startSystem } from 'braided'
import { SystemBridge, systemConfig } from './system'

// Start the system *before* React mounts
const { system } = await startSystem(systemConfig)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <SystemBridge system={system}>
    <App />
  </SystemBridge>
)
```

### 3. Use in Components

```typescript
// App.tsx
import { useResource } from './system'

function UserProfile({ id }) {
  // Fully typed! TypeScript knows 'apiClient' has a fetchUser method.
  const api = useResource('apiClient') 

  const handleLoad = async () => {
    const user = await api.fetchUser(id)
    console.log(user)
  }

  return <button onClick={handleLoad}>Load User</button>
}
```

---

## Examples

### Basic Example
[`examples/basic/`](./examples/basic/)

Pre-started system with counter and logger. Shows the recommended pattern.

```bash
cd examples/basic
npm install && npm run dev
```

### Singleton Manager Example
[`examples/singleton-manager/`](./examples/singleton-manager/)

Role-based systems (host vs player) with lazy initialization.

```bash
cd examples/singleton-manager
npm install && npm run dev
```

### Lazy Start Example
[`examples/lazy-start/`](./examples/lazy-start/)

System starts on mount with loading states and async resources.

```bash
cd examples/lazy-start
npm install && npm run dev
```

## Reactivity & State Management

**Important:** `braided-react` is a Dependency Injection (DI) library, **not** a state management library. 

When you call `useResource('counter')`, you get the *instance* of the counter. If properties on that instance change, your component **will not re-render** automatically.

### Recommended Pattern: Zustand Integration

To make your UI reactive, we recommend using a state manager like [Zustand](https://github.com/pmndrs/zustand) alongside your Braided resources.

1. **Resource:** Holds the *business logic* and *connections* (e.g., WebSocket).
2. **Store:** Holds the *reactive state* (e.g., current messages).
3. **Component:** Subscribes to the store and calls methods on the resource.

```typescript
// 1. Define Store
const useChatStore = create((set) => ({
  messages: [],
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] }))
}))

// 2. Define Resource (connects to store)
const chatClient = defineResource({
  start: () => {
    const socket = new WebSocket('wss://api.chat.com')
    socket.onmessage = (event) => {
      // Update the store directly!
      useChatStore.getState().addMessage(event.data)
    }
    return {
      sendMessage: (msg) => socket.send(msg)
    }
  }
})

// 3. Component
function ChatRoom() {
  const chat = useResource('chatClient') // Get the imperative resource
  const messages = useChatStore((state) => state.messages) // Get the reactive state

  return (
    <div>
      {messages.map(m => <div key={m}>{m}</div>)}
      <button onClick={() => chat.sendMessage('Hello!')}>Send</button>
    </div>
  )
}
```

This separation of concerns (imperative logic vs. reactive state) is extremely powerful for scaling complex apps.

## Advanced Usage

### Lazy Initialization

If you don't want to block your app startup, use `createSystemManager` and `LazySystemBridge`.

```typescript
import { createSystemManager, LazySystemBridge } from 'braided-react'

// Create a manager singleton
const apiManager = createSystemManager(apiConfig)

function App() {
  return (
    <LazySystemBridge 
      manager={apiManager} 
      SystemBridge={SystemBridge}
      fallback={<div>Connecting to API...</div>}
    >
      <Dashboard />
    </LazySystemBridge>
  )
}
```

### Lifecycle Ownership

- **Pre-started (Recommended):** `startSystem()` before `root.render()`. System lives until page reload.
- **Manager:** `createSystemManager()`. System starts on first demand, persists across remounts.
- **Lazy Bridge:** `LazySystemBridge` with `onUnmount`. System starts on mount, halts on unmount (optional).

## License

ISC
