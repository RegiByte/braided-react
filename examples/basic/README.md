# Basic Example - Pre-Started System

This example demonstrates the **recommended pattern** for using `braided-react`:

1. Start the system **before** React mounts
2. Pass the started system to `SystemBridge`
3. React observes the system, doesn't control it

## Key Concepts

- **System lives outside React** - Started independently, lives beyond component lifecycles
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
// 1. Define system outside React
const system = await startSystem(config)

// 2. Mount React with the system
<SystemBridge system={system}>
  <App />
</SystemBridge>

// 3. Use in components
function MyComponent() {
  const resource = useResource('resourceName')
  // Fully typed!
}
```

This is the cleanest approach - React is purely a view layer.


