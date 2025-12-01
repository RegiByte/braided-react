# Zustand Integration Example

This example demonstrates **managing Zustand stores as Braided resources**:

1. Zustand stores are created in the system, not in components
2. Multiple stores can be coordinated through the system
3. Other resources can observe and react to store changes
4. Stores persist across React remounts and StrictMode

## Key Concepts

- **Stores as Resources** - Zustand stores are Braided resources
- **Centralized State** - All stores live in the system
- **Cross-Resource Observation** - Resources can subscribe to store changes
- **Persistence** - Stores survive component unmounts
- **Type Safety** - Full TypeScript inference

## Running the Example

```bash
npm install
npm run dev
```

Open http://localhost:5173

## File Structure

- `system.ts` - System configuration with Zustand stores as resources
- `hooks.ts` - Typed hooks created with `createSystemHooks`
- `App.tsx` - React app that uses the stores
- `main.tsx` - Entry point that starts system before React

## The Pattern

```typescript
// 1. Define store as a resource
const counterStoreResource = defineResource({
  start: () => {
    const useCounterStore = create((set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 }))
    }))
    
    return { useCounterStore }
  }
})

// 2. Use in components
function Counter() {
  const counterStore = useResource('counterStore')
  const { count, increment } = counterStore.useCounterStore()
  
  return (
    <div>
      <p>{count}</p>
      <button onClick={increment}>+</button>
    </div>
  )
}
```

## Why This Pattern?

**Benefits:**
- ✅ Stores persist across remounts
- ✅ Centralized state management
- ✅ Resources can observe stores
- ✅ Easy to coordinate multiple stores
- ✅ Type-safe from system to components

**Use this when:**
- You need stores that survive React lifecycle
- You want to coordinate multiple stores
- Other resources need to react to state changes
- You're building complex, long-lived applications

## Learn More

- **[Braided](https://github.com/RegiByte/braided)** - The core system composition library
- **[Braided React](https://github.com/RegiByte/braided-react)** - React integration docs
- **[All Examples](../)** - See other integration patterns
