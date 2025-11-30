/**
 * System Managers - Module-level singletons
 *
 * These managers ensure only one instance of each system exists,
 * regardless of how many times React mounts/unmounts.
 */

import { createSystemManager } from 'braided-react'
import { hostSystemConfig, playerSystemConfig } from './system'

/**
 * Host System Manager
 *
 * Manages the host system lifecycle. The system starts on first
 * getSystem() call and persists until destroySystem() is called.
 */
export const hostSystemManager = createSystemManager(hostSystemConfig)

/**
 * Player System Manager
 *
 * Manages the player system lifecycle independently of the host system.
 */
export const playerSystemManager = createSystemManager(playerSystemConfig)


