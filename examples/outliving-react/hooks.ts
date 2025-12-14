/**
 * Typed Hooks for the System
 */

import { createSystemManager, createSystemHooks } from 'braided-react'
import { systemConfig } from './system'

export const manager = createSystemManager(systemConfig)
export const { useSystem, useResource, SystemProvider, useSystemStatus } = createSystemHooks(manager)
