# 🧶 Braided React Examples

Four complete examples demonstrating modern patterns for integrating Braided systems with React.

## Examples Overview

### 1. [useSyncExternalStore](./basic/) - React 18 Integration ⭐ **Start Here**

Modern React integration using `useSyncExternalStore` API.

```bash
cd basic
npm install
npm run dev
```

**Shows:**
- React 18's `useSyncExternalStore` API
- Resources with `subscribe()` and `getSnapshot()` methods
- Automatic re-renders without `useState` or `forceUpdate`
- Clean, modern React patterns

**Best for:** Modern React apps, learning the recommended pattern

---

### 2. [Zustand Integration](./lazy-start/) - Stores as Resources

Zustand stores managed as Braided resources for centralized state.

```bash
cd lazy-start
npm install
npm run dev
```

**Shows:**
- Zustand stores as Braided resources
- Multiple stores coordinated through the system
- Resources observing store changes
- Stores persisting across React remounts

**Best for:** Apps with complex state management, multiple stores

---

### 3. [Event Bus](./singleton-manager/) - Loose Coupling

Resources communicating through an event bus for loose coupling.

```bash
cd singleton-manager
npm install
npm run dev
```

**Shows:**
- Event-driven architecture
- Resources communicating via pub/sub
- Loose coupling between resources
- Observable system behavior
- Coordinated interactions without tight dependencies

**Best for:** Complex systems, event-driven architectures, microservices-style apps

---

### 4. [Outliving React](./outliving-react/) - True Independence 🔥

System that continues running even when React is unmounted.

```bash
cd outliving-react
npm install
npm run dev
```

**Shows:**
- System persisting across React mount/unmount
- Background tasks running independently
- State preservation outside React
- True separation of concerns
- Interactive mount/unmount controls

**Best for:** Music players, WebSocket apps, background sync, game engines

---

## Which Pattern Should I Use?

| If you want to...                        | Use This Example          |
| ---------------------------------------- | ------------------------- |
| Learn modern React integration           | **useSyncExternalStore** ⭐ |
| Automatic re-renders                     | **useSyncExternalStore** ⭐ |
| Manage multiple Zustand stores           | **Zustand Integration**   |
| Centralized state management             | **Zustand Integration**   |
| Loose coupling between resources         | **Event Bus**             |
| Event-driven architecture                | **Event Bus**             |
| Resources that outlive React             | **Outliving React** 🔥    |
| Background tasks independent of React    | **Outliving React** 🔥    |
| Music players, WebSocket connections     | **Outliving React** 🔥    |

## Common Patterns Demonstrated

### 1. **useSyncExternalStore Pattern** (Modern React)
```typescript
const counterResource = defineResource({
  start: () => {
    let count = 0
    const listeners = new Set()
    
    return {
      subscribe: (listener) => {
        listeners.add(listener)
        return () => listeners.delete(listener)
      },
      getSnapshot: () => count,
      increment: () => {
        count++
        listeners.forEach(l => l())
      }
    }
  }
})

// In component
const counter = useResource('counter')
const count = useSyncExternalStore(counter.subscribe, counter.getSnapshot)
```

### 2. **Stores as Resources Pattern** (Zustand)
```typescript
const storeResource = defineResource({
  start: () => {
    const useStore = create((set) => ({
      count: 0,
      increment: () => set((s) => ({ count: s.count + 1 }))
    }))
    return { useStore }
  }
})

// In component
const store = useResource('store')
const { count, increment } = store.useStore()
```

### 3. **Event Bus Pattern** (Loose Coupling)
```typescript
const eventBusResource = defineResource({
  start: () => {
    const listeners = new Map()
    return {
      emit: (event, data) => listeners.get(event)?.forEach(h => h(data)),
      on: (event, handler) => {
        if (!listeners.has(event)) listeners.set(event, new Set())
        listeners.get(event).add(handler)
        return () => listeners.get(event).delete(handler)
      }
    }
  }
})

// Resources communicate via events
timerResource.emit('tick', Date.now())
counterResource.on('tick', () => count++)
```

### 4. **Outliving React Pattern** (Independence)
```typescript
// System starts before React
const { system } = await startSystem(config)

// Mount React
root.render(<SystemBridge system={system}><App /></SystemBridge>)

// Unmount React (system keeps running!)
root.unmount()

// Remount React (state preserved!)
root.render(<SystemBridge system={system}><App /></SystemBridge>)
```

## Core Principles

All examples follow these principles:

1. **System lives outside React** - React observes, doesn't control
2. **Type-safe hooks** - Full inference from config to components
3. **No ref counting** - System doesn't care about React's mount/unmount
4. **Explicit cleanup** - Halt system when truly done, not on unmount
5. **StrictMode proof** - Resources survive double-mounting

## Learning Path

1. **Day 1:** [useSyncExternalStore](./basic/) - Learn modern React integration
2. **Day 2:** [Zustand Integration](./lazy-start/) - See centralized state management
3. **Day 3:** [Event Bus](./singleton-manager/) - Understand loose coupling
4. **Day 4:** [Outliving React](./outliving-react/) - Experience true independence
5. **Day 5:** Build your own! Mix and match patterns as needed

## Tips

- Open DevTools console to see system lifecycle logs
- Try React DevTools to see how systems are just context
- Experiment with StrictMode - systems survive double-mounting
- Check the README in each example for specific details
- The "Outliving React" example has interactive mount/unmount controls!

## Real-World Use Cases

### useSyncExternalStore
- Modern React apps
- Clean component integration
- Automatic reactivity

### Zustand Integration
- Complex state management
- Multiple coordinated stores
- E-commerce apps, dashboards

### Event Bus
- Microservices-style architecture
- Plugin systems
- Complex coordinated workflows
- Real-time collaboration apps

### Outliving React
- Music/video players
- WebSocket/WebRTC connections
- Background sync
- Game engines
- Session management
- Real-time chat

---

**Untangle your code. Compose your systems. Let React observe.** 🧶

[Main Docs](../README.md) • [npm](https://www.npmjs.com/package/braided-react) • [GitHub](https://github.com/RegiByte/braided-react)
