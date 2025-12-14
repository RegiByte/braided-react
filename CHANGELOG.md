# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-12-13

### 🎯 Major Redesign - Observer Pattern & Suspense Integration

This release represents a fundamental redesign of `braided-react` based on lessons learned from building real-world applications. The new design embraces the **Observer Pattern** and **direct closure access**, while integrating seamlessly with React's primitives (Suspense, ErrorBoundary).

### Added

- **Direct Closure Access**: Manager is now passed to `createSystemHooks()`, enabling direct access without Context indirection
- **Automatic Suspense Integration**: `useSystem()` and `useResource()` now suspend (throw Promise) while system is starting
- **Automatic ErrorBoundary Integration**: Hooks throw errors when system startup fails, triggering ErrorBoundary
- **Manual Control Hook**: New `useSystemStatus()` hook for explicit startup control (welcome screens, deferred startup)
- **Config Exposure**: `manager.config` now exposed for inspection and testing
- **SystemProvider**: Renamed from `SystemBridge` for clarity (Context override for testing/DI)

### Changed

- **BREAKING**: `createSystemHooks()` now requires a manager parameter
  - **Before**: `createSystemHooks<typeof config>()`
  - **After**: `createSystemHooks(manager)`
- **BREAKING**: `SystemBridge` renamed to `SystemProvider`
  - More accurately reflects its purpose (Context injection for testing)
- **Resolution Order**: Hooks now check Context first (DI override), then fall back to manager (production)

### Removed

- **BREAKING**: `LazySystemBridge` component removed
  - **Replaced by**: `<Suspense>` + `useSystem()` (automatic)
  - **Or**: `useSystemStatus()` (manual control)

### Migration Guide

#### Pattern 1: Automatic with Suspense (Recommended)

**Before (v0.0.2):**
```typescript
const { SystemBridge, useSystem } = createSystemHooks<typeof config>()
const manager = createSystemManager(config)

<LazySystemBridge manager={manager} SystemBridge={SystemBridge}>
  <App />
</LazySystemBridge>
```

**After (v0.1.0):**
```typescript
const manager = createSystemManager(config)
const { useSystem } = createSystemHooks(manager)

<Suspense fallback={<Loading />}>
  <ErrorBoundary FallbackComponent={ErrorScreen}>
    <App />
  </ErrorBoundary>
</Suspense>
```

#### Pattern 2: Manual Control

**Before (v0.0.2):**
```typescript
// Had to manage state manually outside LazySystemBridge
const [started, setStarted] = useState(false)

if (!started) {
  return <WelcomeScreen onStart={() => setStarted(true)} />
}

return (
  <LazySystemBridge manager={manager} SystemBridge={SystemBridge}>
    <App />
  </LazySystemBridge>
)
```

**After (v0.1.0):**
```typescript
const { useSystemStatus } = createSystemHooks(manager)

function App() {
  const { isIdle, isLoading, startSystem } = useSystemStatus()
  
  if (isIdle) return <WelcomeScreen onStart={startSystem} />
  if (isLoading) return <LoadingScreen />
  return <ChatRoom />
}
```

#### Pattern 3: Testing (No Changes!)

Testing with Context injection still works the same way:

```typescript
const { SystemProvider } = createSystemHooks(manager)

test('component works', async () => {
  const { system } = await startSystem(mockConfig)
  
  render(
    <SystemProvider system={system}>
      <Component />
    </SystemProvider>
  )
})
```

### Design Rationale

#### Why Direct Closure Access?

**Problem**: Context was used to pass system reference to React, but the system already lives in closure space (Z-axis). React can observe it directly through hooks.

**Solution**: Pass manager to `createSystemHooks()`. Hooks access the manager directly from closure.

**Benefits**:
- ✅ Simpler mental model (one source of truth)
- ✅ Less boilerplate (no wrapper component needed)
- ✅ Faster (no context lookup)
- ✅ Aligns with Observer Pattern (React observes closure space)

#### Why Suspense Integration?

**Problem**: Loading states were managed via callbacks (`fallback` prop) instead of React's built-in primitives.

**Solution**: `useSystem()` throws Promise when system is starting, triggering Suspense.

**Benefits**:
- ✅ Standard React pattern (developers already know this)
- ✅ Composable (multiple Suspense boundaries)
- ✅ Works with concurrent rendering
- ✅ Less code (no manual loading state)

#### Why ErrorBoundary Integration?

**Problem**: Error handling was callback-based (`onError` prop), not composable.

**Solution**: `useSystem()` throws Error when startup fails, triggering ErrorBoundary.

**Benefits**:
- ✅ Standard React pattern
- ✅ Composable error boundaries
- ✅ Centralized error handling
- ✅ User-friendly fallbacks

#### Why Keep Context?

**Problem**: Testing needs dependency injection.

**Solution**: Context as optional override, not requirement. Check Context first, then manager.

**Benefits**:
- ✅ Flexible testing (mock entire system)
- ✅ Multi-tenancy support
- ✅ Runtime config changes
- ✅ Backward compatible (testing pattern unchanged)

#### Why Manual Control Hook?

**Problem**: Some apps need explicit startup timing (welcome screens, deferred startup).

**Solution**: `useSystemStatus()` hook that doesn't suspend, returns status and manual trigger.

**Benefits**:
- ✅ Welcome screens before startup
- ✅ Deferred startup until user action
- ✅ Custom loading/error UI
- ✅ Not prescriptive (use when needed)

### The Z-Axis Model

This redesign fully embraces the **dimensional model**:

- **Z-axis (Closure Space)**: Where systems live independently
- **X-Y Plane (React Tree)**: Where components render
- **Hooks**: Windows between these dimensions

Systems are **module singletons** in closure space. React components observe them through hooks. This separation gives you:

1. **Lifecycle independence** - System outlives React mounts/unmounts
2. **No prop drilling** - Direct access from any component
3. **Testing flexibility** - Context override for dependency injection
4. **Performance** - System lives outside React's render cycle

### Observer Pattern

React components are **observers** of your system. They watch for changes and re-render when needed. But they don't control the system's lifecycle.

**Before**: Context made it seem like React "owned" the system
**After**: Direct closure access makes it clear React is just observing

This is the same pattern used by:
- React Query (for server state)
- Zustand (for client state)
- Jotai (for atomic state)

### Success Criteria

This redesign achieves:

- ✅ **Less boilerplate** - Fewer concepts, simpler setup
- ✅ **Better integration** - Works with Suspense, ErrorBoundary, DevTools
- ✅ **More flexible** - Context still available for DI when needed
- ✅ **Type-safe** - Full inference preserved
- ✅ **Testable** - Multiple testing patterns supported
- ✅ **Performant** - Direct closure access, no context overhead

### Acknowledgments

This redesign was informed by building real-world examples, particularly a WebSocket chat application. The patterns that emerged from that work revealed the true nature of the library: **React observes systems in closure space**.

---

## [0.0.2] - 2024-12-XX

### Added

- Initial release
- `createSystemHooks()` for typed React hooks
- `createSystemManager()` for singleton system management
- `LazySystemBridge` component for lazy initialization
- `SystemBridge` context provider
- Full TypeScript support with type inference

### Documentation

- Basic examples
- README with usage patterns
- API documentation

---

## [0.0.1] - 2024-12-XX

### Added

- Initial prototype
- Core concepts established

---

[0.1.0]: https://github.com/RegiByte/braided-react/compare/v0.0.2...v0.1.0
[0.0.2]: https://github.com/RegiByte/braided-react/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/RegiByte/braided-react/releases/tag/v0.0.1

