# Singleton Manager Example

This example demonstrates the **singleton manager pattern** - useful when you want:

1. System to start lazily (on first use, not at app boot)
2. System to be reused across multiple React mount/unmount cycles
3. Explicit control over when to destroy the system

## Key Concepts

- **Module-level singleton** - System manager lives outside React
- **Lazy initialization** - System starts on first `getSystem()` call
- **Idempotent** - Multiple calls to `getSystem()` return the same instance
- **Explicit cleanup** - Call `destroySystem()` when truly done

## Use Cases

- **Role-based systems** - Different system configs for host vs player
- **Navigation** - System persists across route changes
- **Hot reload** - System survives HMR in development

## Running the Example

```bash
npm install
npm run dev
```

Open http://localhost:5173

## The Pattern

```typescript
// 1. Create manager at module level
const systemManager = createSystemManager(config)

// 2. In components, get the system
const system = await systemManager.getSystem()

// 3. When done (e.g., logout), destroy it
await systemManager.destroySystem()
```

This pattern is what you used in your game, Sir RegiByte!


