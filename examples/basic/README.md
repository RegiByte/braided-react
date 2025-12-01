# Basic Example - useSyncExternalStore

This example demonstrates using **React 18's useSyncExternalStore** with Braided resources:

1. Start the system **before** React mounts
2. Resources provide `subscribe()` and `getSnapshot()` methods
3. Components use `useSyncExternalStore` for automatic reactivity
4. No `useState` or `forceUpdate` hacks needed!

## Key Concepts

- **useSyncExternalStore** - React 18 API for subscribing to external state sources
- **subscribe(listener)** - Resources notify React when state changes
- **getSnapshot()** - Returns current state for rendering
- **Automatic re-renders** - React handles updates efficiently
- **Type-safe hooks** - Full TypeScript inference from config to components
- **StrictMode proof** - React can mount/unmount freely, system stays alive

## Running the Example

```bash
npm install
npm run dev
```

Open http://localhost:5173

## File Structure

- `system.ts` - System configuration with resources
- `hooks.ts` - Typed hooks created with `createSystemHooks`
- `App.tsx` - React app that uses the system
- `main.tsx` - Entry point that starts system before React

## The Pattern

```typescript
// 1. Define resource with subscribe/getSnapshot
const counterResource = defineResource({
  start: () => {
    let count = 0;
    const listeners = new Set();

    return {
      subscribe: (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      getSnapshot: () => count,
      increment: () => {
        count++;
        listeners.forEach((l) => l()); // Notify subscribers
      },
    };
  },
});

// 2. Use in components with useSyncExternalStore
function Counter() {
  const counter = useResource("counter");
  const count = useSyncExternalStore(counter.subscribe, counter.getSnapshot);

  return (
    <div>
      <p>{count}</p>
      <button onClick={() => counter.increment()}>+</button>
    </div>
  );
}
```

This is the **modern React way** to integrate external state sources!
