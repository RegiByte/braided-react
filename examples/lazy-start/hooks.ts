import { createSystemHooks } from 'braided-react'
import { systemConfig } from './system'

export const { SystemBridge, useSystem, useResource } =
  createSystemHooks<typeof systemConfig>()


