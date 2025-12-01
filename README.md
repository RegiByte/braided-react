# 🧶 Braided React

> **React integration for [Braided](https://github.com/RegiByte/braided) - Bridge your stateful systems to React without giving up lifecycle control.**

React observes your system. React doesn't own it.

**Braided** is a minimal, type-safe library for declarative system composition with dependency-aware lifecycle management. **Braided React** provides the bridge to use those systems seamlessly in React applications.

## What is Braided?

[**Braided**](https://github.com/RegiByte/braided) is a minimal (~300 lines), type-safe library for declarative system composition with dependency-aware lifecycle management. It lets you define stateful resources (databases, WebSockets, caches, etc.) with explicit dependencies, and handles starting/stopping them in the correct order.

Think of it as **dependency injection + lifecycle management** for JavaScript, inspired by Clojure's Integrant.

## Why Braided React?

Modern React apps often need to manage complex, long-lived resources that don't fit neatly into the React component lifecycle:

- **WebSockets & Real-time Feeds** (Chat, Multiplayer Games)
- **Audio/Video Contexts** (WebRTC, Music Apps)
- **Complex API Clients** (Authentication, Retries, Caching)
- **Game Loops & Simulations**
- **Background Tasks** (Sync, Polling, Timers)

Managing these inside `useEffect` often leads to "dependency hell," double-initialization in StrictMode, and race conditions.

**Braided React** solves this by letting you define your system _outside_ React using Braided, and then bridging it _into_ React as a fully-typed dependency injection layer. Your resources outlive React's mount/unmount cycles and you decide when/how to stop them.

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

**Requirements:**

- `react >= 18.0.0` (peer dependency)
- `braided >= 0.0.4` (peer dependency)

**Note:** You need both libraries. [Braided](https://github.com/RegiByte/braided) defines your system, Braided React bridges it to React.

## Quick Start

### 1. Define Your System (outside React)

```typescript
// system.ts
import { defineResource } from "braided";
import { createSystemHooks } from "braided-react";

// A simple logger resource
const loggerResource = defineResource({
  start: () => ({
    log: (msg: string) => console.log(`[Log]: ${msg}`),
  }),
});

// An API client resource that depends on logger
const apiClient = defineResource({
  dependencies: ["logger"],
  start: ({ logger }: { logger: StartedResource<typeof loggerResource> }) => ({
    fetchUser: async (id: string) => {
      logger.log(`Fetching user: ${id}`);
      return fetch(`/api/users/${id}`).then((r) => r.json());
    },
  }),
});

export const systemConfig = { logger: loggerResource, api: apiClient };

// Create your typed hooks!
export const { SystemBridge, useResource } =
  createSystemHooks<typeof systemConfig>();
```

### 2. Initialize & Bridge

```typescript
// main.tsx
import { startSystem } from "braided";
import { SystemBridge, systemConfig } from "./system";

// Start (or just kick off) the system *before* React mounts
const { system } = await startSystem(systemConfig);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <SystemBridge system={system}>
    <App />
  </SystemBridge>
);
```

### 3. Use in Components

```typescript
// App.tsx
import { useResource } from "./system";

function UserProfile({ id }) {
  // Fully typed! TypeScript knows 'apiClient' has a fetchUser method.
  const api = useResource("apiClient");

  const handleLoad = async () => {
    const user = await api.fetchUser(id);
    console.log(user);
  };

  return <button onClick={handleLoad}>Load User</button>;
}
```

---

## Examples

We provide **4 complete examples** demonstrating different integration patterns. Each solves different use cases:

### 1. [Basic - useSyncExternalStore](./examples/basic/) ⭐ **Start Here**

Modern React 18 integration using `useSyncExternalStore` API for automatic reactivity.

```bash
cd examples/basic
npm install && npm run dev
```

**Best for:** Modern React apps, learning the recommended pattern

### 2. [Lazy Start - Zustand Integration](./examples/lazy-start/)

Zustand stores managed as Braided resources for centralized state management.

```bash
cd examples/lazy-start
npm install && npm run dev
```

**Best for:** Apps with complex state management, multiple coordinated stores

### 3. [Singleton Manager - Event Bus](./examples/singleton-manager/)

Resources communicating through an event bus for loose coupling.

```bash
cd examples/singleton-manager
npm install && npm run dev
```

**Best for:** Complex systems, event-driven architectures, microservices/microfrontend-style apps

### 4. [Outliving React](./examples/outliving-react/) 🔥

Simple example that demonstrates the core functionality of the library: your system running even when React is unmounted. It's up to you how to compose this powerful pattern into your app.

```bash
cd examples/outliving-react
npm install && npm run dev
```

**Best for:** Music players, WebSocket apps, background sync, game engines, scheduled tasks, etc.

See [examples/README.md](./examples/README.md) for detailed comparison and learning path.

## Reactivity & State Management

**Important:** `braided-react` is a Lifecycle management and Dependency Injection (DI) library, **not** a state management library.

When you call `useResource('counter')`, you get the _instance_ of the counter. If properties on that instance change, your component **will not re-render** automatically.

### Recommended Pattern: Zustand Integration or your preferred state management library

To make your UI reactive, we recommend using a state manager like [Zustand](https://github.com/pmndrs/zustand) alongside your system resources or as one of them if you'd like.

1. **Resource:** Holds the _business logic_ and _connections_ (e.g., WebSocket).
2. **Store:** Holds the _reactive state_ (e.g., current messages).
3. **Component:** Subscribes to the store and calls methods on the resource.

```typescript
// 1. Define Store
const useChatStore = create((set) => ({
  messages: [],
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
}));

// 2. Define Resource (connects to store)
const chatClient = defineResource({
  start: () => {
    const socket = new WebSocket("wss://api.chat.com");
    socket.onmessage = (event) => {
      // Update the store directly!
      useChatStore.getState().addMessage(event.data);
    };
    return {
      sendMessage: (msg) => socket.send(msg),
    };
  },
});

// 3. Component
function ChatRoom() {
  const chat = useResource("chatClient"); // Get the imperative resource
  const messages = useChatStore((state) => state.messages); // Get the reactive state

  return (
    <div>
      {messages.map((m) => (
        <div key={m}>{m}</div>
      ))}
      <button onClick={() => chat.sendMessage("Hello!")}>Send</button>
    </div>
  );
}
```

This separation of concerns (imperative logic vs. reactive state) is extremely powerful for scaling complex apps.

## Advanced Usage

### Lazy Initialization

If you don't want to block your app startup, use `createSystemManager` and `LazySystemBridge`.

```typescript
import { createSystemManager, LazySystemBridge } from "braided-react";

// Create a manager singleton
const apiManager = createSystemManager(apiConfig);

function App() {
  return (
    <LazySystemBridge
      manager={apiManager}
      SystemBridge={SystemBridge}
      fallback={<div>Connecting to API...</div>}
    >
      <Dashboard />
    </LazySystemBridge>
  );
}
```

### Lifecycle Ownership

- **Pre-started (Recommended):** `startSystem()` before `root.render()`. System lives until page reload.
- **Manager:** `createSystemManager()`. System starts on first demand, persists across remounts.
- **Lazy Bridge:** `LazySystemBridge` with `onUnmount`. System starts on mount, halts on unmount (optional).

## Related Projects

- **[Braided](https://github.com/RegiByte/braided)** - The core system composition library
- **[Braided React](https://github.com/RegiByte/braided-react)** - React integration (this library)

## Philosophy

**Braided React** follows the same philosophy as Braided:

1. **Simple over easy** - Minimal API that composes well
2. **Explicit over implicit** - No magic, no scanning, just data
3. **Data over code** - Systems are declared as data structures
4. **Testable by default** - No global state, easy to mock
5. **Type-safe** - Full TypeScript support with inference
6. **React observes, doesn't own** - System lifecycle is independent

For more on the philosophy, see the [Braided README](https://github.com/RegiByte/braided#philosophy).

## License

ISC
