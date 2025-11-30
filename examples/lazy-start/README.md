# Lazy Start Example

This example demonstrates the **lazy start pattern** using `LazySystemBridge`:

1. System starts when the component mounts
2. Flexible lifecycle management with three patterns
3. Useful for route-based lazy loading

## Key Concepts

- **React-triggered start** - System starts on mount, not before
- **Flexible cleanup** - Choose your lifecycle pattern
- **Loading states** - Show fallback while system starts
- **Error handling** - Handle startup errors gracefully

## Use Cases

- **Route-based loading** - Start system when entering a route
- **Conditional systems** - Only start if user takes certain action
- **Progressive enhancement** - Start heavy systems on demand

## Running the Example

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Three Lifecycle Patterns

### 1. With Manager (Recommended for Persistent Systems)

```typescript
import { createSystemManager } from 'braided-react'

const manager = createSystemManager(systemConfig)

<LazySystemBridge
  manager={manager}
  SystemBridge={SystemBridge}
  fallback={<LoadingScreen />}
>
  <App />
</LazySystemBridge>

// Cleanup when truly done
await manager.destroySystem()
```

**Benefits:**
- Idempotent - survives remounts
- Explicit cleanup control
- Perfect for navigation persistence

### 2. With onUnmount Callback (Explicit Cleanup)

```typescript
import { haltSystem } from 'braided'

<LazySystemBridge
  config={systemConfig}
  SystemBridge={SystemBridge}
  onUnmount={(system) => haltSystem(systemConfig, system)}
>
  <App />
</LazySystemBridge>
```

**Benefits:**
- System halts when component unmounts
- Good for temporary systems
- Custom cleanup logic

### 3. Standalone (System Lives Beyond Component)

```typescript
<LazySystemBridge
  config={systemConfig}
  SystemBridge={SystemBridge}
  fallback={<LoadingScreen />}
>
  <App />
</LazySystemBridge>
```

**Benefits:**
- Simplest API
- System persists after unmount
- Cleanup managed elsewhere

## This Example

This example uses the **standalone pattern** - the system starts on mount but doesn't halt on unmount. This is perfect for route-based loading where you want the system to persist across navigation.


