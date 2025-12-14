/**
 * braided-react
 *
 * React integration for Braided - Bridge your stateful systems to React
 * without giving up lifecycle control.
 *
 * Philosophy:
 * - React observes the system, doesn't own it
 * - System lifecycle is managed outside React (closure space)
 * - Context is optional (only for DI/testing)
 * - Integrates with React primitives (Suspense, ErrorBoundary)
 *
 * @example Direct access (production):
 * ```typescript
 * import { createSystemManager, createSystemHooks } from 'braided-react'
 *
 * // system.ts - ONE source of truth
 * export const manager = createSystemManager(config)
 * export const { useSystem, useResource, SystemProvider } = createSystemHooks(manager)
 *
 * // App.tsx
 * function App() {
 *   return (
 *     <Suspense fallback={<Loading />}>
 *       <ErrorBoundary FallbackComponent={ErrorScreen}>
 *         <ChatRoom />
 *       </ErrorBoundary>
 *     </Suspense>
 *   )
 * }
 *
 * function ChatRoom() {
 *   const system = useSystem() // Direct closure access, suspends automatically!
 *   return <div>...</div>
 * }
 * ```
 *
 * @example Context injection (testing):
 * ```typescript
 * import { SystemProvider } from './system'  // Same hooks as production!
 * import { startSystem } from 'braided'
 *
 * test('component works', async () => {
 *   const mockConfig = { ...config, api: mockApiResource }
 *   const { system } = await startSystem(mockConfig)
 *   
 *   render(
 *     <SystemProvider system={system}>
 *       <Component />
 *     </SystemProvider>
 *   )
 * })
 * ```
 *
 * @example Manual control:
 * ```typescript
 * import { useSystemStatus } from './system'
 * 
 * function App() {
 *   const { isIdle, isLoading, startSystem } = useSystemStatus()
 *   
 *   if (isIdle) return <WelcomeScreen onStart={startSystem} />
 *   if (isLoading) return <LoadingScreen />
 *   return <ChatRoom />
 * }
 * ```
 */

export { createSystemHooks } from "./hooks";
export { createSystemManager } from "./manager";

export type { ManagedSystem } from "./manager";
export type { SystemStatus } from "./hooks";
