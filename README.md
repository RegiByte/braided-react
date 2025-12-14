# 🧶 Braided React

> **React integration for [Braided](https://github.com/RegiByte/braided) - Bridge your stateful systems to React without giving up lifecycle control.**

React observes your system. React doesn't own it.

**Braided** is a minimal, type-safe library for declarative system composition with dependency-aware lifecycle management. **Braided React** provides the bridge to use those systems seamlessly in React applications.

## What is Braided?

[**Braided**](https://github.com/RegiByte/braided) is a minimal (~250 lines), type-safe library for declarative system composition with dependency-aware lifecycle management. It lets you define stateful resources (databases, WebSockets, caches, etc.) with explicit dependencies, and handles starting/stopping them in the correct order.

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

- 🔌 **Direct Closure Access:** System lives in module scope, React observes directly
- 🛡️ **Lifecycle Safety:** Resources survive remounts and StrictMode
- 🎯 **Type Safety:** Fully inferred types from your system config to your hooks
- 🧩 **Observer Pattern:** React components observe the system; they don't drive it
- ⚡ **React Primitives:** Integrates with Suspense and ErrorBoundary
- 🧪 **Testing Friendly:** Optional Context for dependency injection in tests
- 📦 **Minimal:** Thin wrapper around React hooks and Context (for testing)

## Installation

```bash
npm install braided-react braided
```

**Requirements:**

- `react >= 18.0.0` (peer dependency)
- `braided >= 0.0.4` (peer dependency)

**Note:** You need both libraries. [Braided](https://github.com/RegiByte/braided) defines your system, Braided React bridges it to React.

## Quick Start

### 1. Define Your System (once, at module level)

```typescript
// system.ts
import { defineResource } from "braided";
import { createSystemManager, createSystemHooks } from "braided-react";

// A simple counter resource
const counterResource = defineResource({
  start: () => {
    let count = 0;
    const listeners = new Set<() => void>();

    return {
      subscribe: (listener: () => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      getSnapshot: () => count,
      increment: () => {
        count++;
        listeners.forEach((l) => l());
      },
    };
  },
  halt: () => {},
});

// A logger resource that depends on counter
const loggerResource = defineResource({
  dependencies: ["counter"],
  start: ({ counter }) => ({
    logCount: () => console.log(`Count: ${counter.getSnapshot()}`),
  }),
  halt: () => {},
});

// System configuration
export const systemConfig = {
  counter: counterResource,
  logger: loggerResource,
};

// Create manager and hooks ONCE
export const manager = createSystemManager(systemConfig);
export const { useSystem, useResource, SystemProvider } =
  createSystemHooks(manager);
```

### 2. Use in Your App (automatic with Suspense)

```typescript
// App.tsx
import { Suspense } from "react";
import { useResource } from "./system";

function App() {
  return (
    <Suspense fallback={<div>Starting system...</div>}>
      <Counter />
    </Suspense>
  );
}

function Counter() {
  const counter = useResource("counter"); // Suspends automatically!
  const count = useSyncExternalStore(counter.subscribe, counter.getSnapshot);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => counter.increment()}>Increment</button>
    </div>
  );
}
```

That's it! The system starts automatically when `useResource` is first called, and React suspends until it's ready.

## Core Concepts

### The Z-Axis: Systems Live in Closure Space

Braided React embraces a **dimensional model**:

- **Z-axis (Closure Space):** Where your system lives independently
- **X-Y Plane (React Tree):** Where your components render
- **Hooks:** Windows between these dimensions

Your system is a **module singleton** in closure space. React components observe it through hooks. This separation gives you:

1. **Lifecycle independence** - System outlives React mounts/unmounts
2. **No prop drilling** - Direct access from any component
3. **Testing flexibility** - Context override for dependency injection

### Three Usage Modes

#### Mode 1: Production (Automatic - Recommended)

```typescript
// system.ts
export const manager = createSystemManager(config);
export const { useSystem } = createSystemHooks(manager);

// App.tsx
<Suspense fallback={<Loading />}>
  <ErrorBoundary FallbackComponent={ErrorScreen}>
    <App />
  </ErrorBoundary>
</Suspense>;
```

- ✅ Minimal boilerplate
- ✅ Automatic loading (Suspense)
- ✅ Automatic errors (ErrorBoundary)
- ✅ Direct closure access (fast)

#### Mode 2: Manual Control

```typescript
// App.tsx
import { useSystemStatus } from "./system";

function App() {
  const { isIdle, isLoading, startSystem } = useSystemStatus();

  if (isIdle) {
    return <WelcomeScreen onStart={startSystem} />;
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  return <ChatRoom />;
}
```

Use when you need:

- Welcome screen before startup
- Defer startup until user action
- Custom loading/error UI

#### Mode 3: Testing (Context Injection)

```typescript
// Component.test.tsx
import { SystemProvider } from "./system"; // Same hooks as production!
import { startSystem } from "braided";

test("component works", async () => {
  // Start system with mock resources
  const mockConfig = {
    ...config,
    api: mockApiResource, // defineResource with vi.fn() inside
  };
  const { system } = await startSystem(mockConfig);

  render(
    <SystemProvider system={system}>
      <Component />
    </SystemProvider>
  );

  // Test...

  await haltSystem(mockConfig, system);
});
```

Benefits:

- ✅ Real lifecycle (resources start/halt properly)
- ✅ Easy mocking (just define mock resources)
- ✅ Mix and match (swap only what you need)
- ✅ Type-safe (same config shape)

## API Reference

### `createSystemManager(config)`

Creates a manager for idempotent system startup.

```typescript
const manager = createSystemManager(systemConfig);

// Methods:
manager.getSystem(); // Promise<StartedSystem> - Start or get system
manager.destroySystem(); // Promise<void> - Halt and reset
manager.getCurrentSystem(); // StartedSystem | null - Sync check
manager.getStartupErrors(); // Map<string, Error> | null
manager.isStarted(); // boolean
manager.config; // TConfig - Exposed for inspection
```

### `createSystemHooks(manager)`

Creates typed hooks for a system. **Always pass the manager.**

```typescript
const { useSystem, useResource, useSystemStatus, SystemProvider } =
  createSystemHooks(manager);
```

**Returns:**

- `useSystem()` - Get entire system (suspends until ready)
- `useResource(id)` - Get single resource (suspends until ready)
- `useSystemStatus()` - Manual control (doesn't suspend)
- `SystemProvider` - Context override for testing

### `useSystem()`

Hook to access the entire started system.

```typescript
function Component() {
  const system = useSystem(); // Suspends automatically!
  // system.counter, system.logger, etc.
}
```

**Behavior:**

- Checks Context first (if `SystemProvider` in tree)
- Falls back to manager
- **Suspends** (throws Promise) while starting
- **Throws Error** if startup failed
- Returns system once ready

### `useResource(resourceId)`

Hook to access a single resource with full type inference.

```typescript
function Component() {
  const counter = useResource("counter"); // Fully typed!
  counter.increment();
}
```

### `useSystemStatus()`

Hook for manual startup control. **Does not suspend.**

```typescript
function Component() {
  const { isIdle, isLoading, isReady, isError, system, errors, startSystem } =
    useSystemStatus();

  if (isIdle) return <button onClick={startSystem}>Start</button>;
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {errors}</div>;

  return <div>Ready!</div>;
}
```

### `SystemProvider`

Context provider for dependency injection (testing).

```typescript
<SystemProvider system={mockSystem}>
  <Component />
</SystemProvider>
```

## Reactivity & State Management

**Important:** `braided-react` is a **lifecycle management and dependency injection** library, not a state management library.

When you call `useResource('counter')`, you get the _instance_ of the counter. If properties change, your component **will not re-render** automatically.

### Recommended Pattern: useSyncExternalStore

React 18's `useSyncExternalStore` is perfect for subscribing to external state:

```typescript
const counterResource = defineResource({
  start: () => {
    let count = 0;
    const listeners = new Set<() => void>();

    return {
      // For useSyncExternalStore
      subscribe: (listener: () => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      getSnapshot: () => count,

      // Public API
      increment: () => {
        count++;
        listeners.forEach((l) => l());
      },
    };
  },
});

// In component:
function Counter() {
  const counter = useResource("counter");
  const count = useSyncExternalStore(counter.subscribe, counter.getSnapshot);

  return <button onClick={() => counter.increment()}>{count}</button>;
}
```

### Alternative: Zustand Integration

You can also use Zustand stores as resources:

```typescript
const chatStoreResource = defineResource({
  start: () =>
    create((set) => ({
      messages: [],
      addMessage: (msg) =>
        set((state) => ({ messages: [...state.messages, msg] })),
    })),
  halt: () => {},
});

// In component:
function Chat() {
  const useStore = useResource("chatStore");
  const messages = useStore((state) => state.messages);
  return (
    <div>
      {messages.map((m) => (
        <div key={m}>{m}</div>
      ))}
    </div>
  );
}
```

## Examples

We provide **4 complete examples** demonstrating different integration patterns:

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

**Best for:** Complex systems, event-driven architectures

### 4. [Outliving React](./examples/outliving-react/) 🔥

System running even when React is unmounted.

```bash
cd examples/outliving-react
npm install && npm run dev
```

**Best for:** Music players, WebSocket apps, background sync, game engines

See [examples/README.md](./examples/README.md) for detailed comparison.

## Testing

### Testing with Mock Resources (Recommended)

```typescript
import { SystemProvider } from "./system";
import { startSystem, haltSystem } from "braided";

describe("ChatRoom", () => {
  test("sends messages", async () => {
    // Define mock resource
    const mockTransport = defineResource({
      start: () => ({
        send: vi.fn(),
        receive: vi.fn(),
      }),
      halt: () => {},
    });

    // Create test config
    const testConfig = {
      ...productionConfig,
      transport: mockTransport, // Swap just one resource
    };

    // Start system with mock
    const { system } = await startSystem(testConfig);

    render(
      <SystemProvider system={system}>
        <ChatRoom />
      </SystemProvider>
    );

    // Test...
    fireEvent.click(screen.getByText("Send"));
    expect(system.transport.send).toHaveBeenCalled();

    // Cleanup
    await haltSystem(testConfig, system);
  });
});
```

### Testing with Manual Mocks (Fast Unit Tests)

```typescript
test("displays count", () => {
  const mockSystem = {
    counter: { count: 42, increment: vi.fn() },
  } as StartedSystem<typeof config>;

  render(
    <SystemProvider system={mockSystem}>
      <Counter />
    </SystemProvider>
  );

  expect(screen.getByText("42")).toBeInTheDocument();
});
```

## Migration from v0.0.2

### Breaking Changes

1. **`LazySystemBridge` removed** - Use `<Suspense>` + `useSystem` or `useSystemStatus`
2. **`createSystemHooks` requires manager** - Pass manager as parameter
3. **`SystemBridge` renamed to `SystemProvider`** - Clearer purpose

### Before (v0.0.2)

```typescript
const { SystemBridge, useSystem } = createSystemHooks<typeof config>();
const manager = createSystemManager(config);

<LazySystemBridge manager={manager} SystemBridge={SystemBridge}>
  <App />
</LazySystemBridge>;
```

### After (v0.1.0) - Automatic

```typescript
const manager = createSystemManager(config);
const { useSystem } = createSystemHooks(manager);

<Suspense fallback={<Loading />}>
  <App />
</Suspense>;
```

### After (v0.1.0) - Manual

```typescript
const manager = createSystemManager(config);
const { useSystemStatus } = createSystemHooks(manager);

function App() {
  const { isIdle, isLoading, startSystem } = useSystemStatus();

  if (isIdle) return <WelcomeScreen onStart={startSystem} />;
  if (isLoading) return <LoadingScreen />;
  return <ChatRoom />;
}
```

See [CHANGELOG.md](./CHANGELOG.md) for detailed migration guide.

## Philosophy

**Braided React** follows the same philosophy as Braided:

1. **Simple over easy** - Minimal API that composes well
2. **Explicit over implicit** - No magic, no scanning, just data
3. **Data over code** - Systems are declared as data structures
4. **Testable by default** - No global state, easy to mock
5. **Type-safe** - Full TypeScript support with inference
6. **React observes, doesn't own** - System lifecycle is independent

### The Observer Pattern

React components are **observers** of your system. They watch for changes and re-render when needed. But they don't control the system's lifecycle. This separation of concerns leads to:

- **Simpler components** - Just observe and render
- **Easier testing** - Mock the system, not React
- **Better performance** - System lives outside React's render cycle
- **More flexibility** - System can be used outside React

## Related Projects

- **[Braided](https://github.com/RegiByte/braided)** - The core system composition library
- **[Braided React](https://github.com/RegiByte/braided-react)** - React integration (this library)

## License

ISC
