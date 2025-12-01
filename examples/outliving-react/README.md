# Outliving React Example

This example demonstrates **the system outliving React's lifecycle**:

1. System starts before React
2. React can be completely unmounted
3. System continues running in the background
4. React can be remounted - state is preserved!
5. Demonstrates true independence from React

## Key Concepts

- **System Persistence** - System runs independently of React
- **State Preservation** - All state survives React unmount/remount
- **Background Tasks** - Tasks continue running without React
- **Mount Tracking** - System tracks React lifecycle events
- **True Independence** - React is just a view layer

## Running the Example

```bash
npm install
npm run dev
```

Open http://localhost:5173

## The Demo

This example includes a **Control Panel** in the top-right corner with two buttons:

- **Mount React** - Mounts the React application
- **Unmount React** - Completely unmounts React (system keeps running!)

### Try This:

1. Start the background task
2. Add some data to the store
3. Click "Unmount React" - React disappears, but system continues!
4. Check the console - background task still ticking
5. Click "Mount React" - React comes back with all state intact!
6. Notice the mount/unmount counters increased

## File Structure

- `system.ts` - System configuration with persistent resources
- `hooks.ts` - Typed hooks created with `createSystemHooks`
- `App.tsx` - React app that uses the system
- `main.tsx` - Entry point with mount/unmount controls

## The Pattern

```typescript
// 1. Start system
const { system } = await startSystem(config)

// 2. Mount React
const root = createRoot(document.getElementById('root'))
root.render(
  <SystemBridge system={system}>
    <App />
  </SystemBridge>
)

// 3. Unmount React (system keeps running!)
root.unmount()

// 4. Remount React (state preserved!)
root = createRoot(document.getElementById('root'))
root.render(
  <SystemBridge system={system}>
    <App />
  </SystemBridge>
)
```

## Why This Matters

**Real-World Use Cases:**

- **Music Players** - Music keeps playing during navigation
- **WebSocket Connections** - Connections persist across route changes
- **Background Sync** - Data syncs even when UI is hidden
- **Game Loops** - Game state persists during UI transitions
- **Session Management** - Session outlives component lifecycle

**Benefits:**

- ✅ True separation of concerns
- ✅ Resources survive navigation
- ✅ Background tasks run independently
- ✅ No "dependency hell" in useEffect
- ✅ StrictMode doesn't cause issues
- ✅ Easy to test resources in isolation

## Architecture

```
┌──────────────────────────────────┐
│         System (Always On)        │
│  ┌────────┐ ┌────────┐ ┌──────┐ │
│  │Session │ │  Data  │ │ Task │ │
│  └────────┘ └────────┘ └──────┘ │
└──────────────┬───────────────────┘
               │
        ┌──────▼──────┐
        │    React    │ ← Can mount/unmount
        │ (View Layer)│    freely!
        └─────────────┘
```

The system is the foundation. React is just a window into it.

## Open DevTools Console

Watch the console as you unmount/remount React:
- System lifecycle logs
- Background task continues ticking
- React mount/unmount events
- Data operations persist

This is the power of Braided - **React observes, doesn't own.**

