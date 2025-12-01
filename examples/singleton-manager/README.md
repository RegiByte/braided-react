# Event Bus Example

This example demonstrates **resource communication through an event bus**:

1. Resources communicate via events, not direct dependencies
2. Loose coupling allows resources to evolve independently
3. Individual parts can be replaced without the rest of the system knowing
4. Event bus enables observable, coordinated systems
5. Resources can emit and subscribe to events outside of React

## Key Concepts

- **Event Bus** - Central hub for resource communication
- **Pub/Sub Pattern** - Resources emit events, others subscribe
- **Loose Coupling** - Resources don't directly depend on each other
- **Observable System** - Easy to add observers without modifying resources
- **Coordination** - Complex interactions without tight coupling

## Running the Example

```bash
npm install
npm run dev
```

Open http://localhost:5173

## File Structure

- `system.ts` - System configuration with event bus and resources
- `hooks.ts` - Typed hooks created with `createSystemHooks`
- `App.tsx` - React app that uses the system
- `main.tsx` - Entry point that starts system before React

## The Pattern

```typescript
// 1. Define event bus resource
const eventBusResource = defineResource({
  start: () => {
    const listeners = new Map()
    
    return {
      emit(event, ...args) {
        listeners.get(event)?.forEach(handler => handler(...args))
      },
      on(event, handler) {
        if (!listeners.has(event)) {
          listeners.set(event, new Set())
        }
        listeners.get(event).add(handler)
        return () => listeners.get(event).delete(handler)
      }
    }
  }
})

// 2. Resources emit events
const timerResource = defineResource({
  dependencies: ['eventBus'],
  start: ({ eventBus }) => {
    setInterval(() => {
      eventBus.emit('timer:tick', Date.now())
    }, 1000)
    
    return { /* ... */ }
  }
})

// 3. Resources listen to events
const counterResource = defineResource({
  dependencies: ['eventBus'],
  start: ({ eventBus }) => {
    let count = 0
    
    eventBus.on('timer:tick', () => {
      count++
    })
    
    return { getCount: () => count }
  }
})
```

## Why This Pattern?

**Benefits:**
- ✅ Loose coupling between resources
- ✅ Easy to add new observers
- ✅ Resources evolve independently
- ✅ Clear communication patterns
- ✅ Observable system behavior

**Use this when:**
- You have multiple resources that need to coordinate
- You want to avoid tight coupling between resources
- You need to add observers without modifying existing code
- You're building complex, event-driven systems
- You want clear separation of concerns

## Architecture

```
┌─────────────┐
│  Event Bus  │ ← Central hub
└──────┬──────┘
       │
   ┌───┴───┬────────┬────────┐
   │       │        │        │
┌──▼──┐ ┌──▼──┐ ┌───▼───┐ ┌──▼──┐
│Timer│ │Count│ │Logger │ │React│
└─────┘ └─────┘ └───────┘ └─────┘
  emit    listen   listen   observe
```

Resources communicate through events, not direct calls!

## Learn More

- **[Braided](https://github.com/RegiByte/braided)** - The core system composition library
- **[Braided React](https://github.com/RegiByte/braided-react)** - React integration docs
- **[All Examples](../)** - See other integration patterns
