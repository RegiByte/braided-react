/**
 * Typed Hooks for Both Systems
 */

import { createSystemHooks } from 'braided-react'
import { hostSystemConfig, playerSystemConfig } from './system'

/**
 * Host System Hooks
 */
export const {
  SystemBridge: HostSystemBridge,
  useSystem: useHostSystem,
  useResource: useHostResource,
} = createSystemHooks<typeof hostSystemConfig>()

/**
 * Player System Hooks
 */
export const {
  SystemBridge: PlayerSystemBridge,
  useSystem: usePlayerSystem,
  useResource: usePlayerResource,
} = createSystemHooks<typeof playerSystemConfig>()


