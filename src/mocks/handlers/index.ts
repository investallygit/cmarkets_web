import { listHandlers } from './lists'
import { marketHandlers } from './market'
import { securityHandlers } from './securities'
import { sessionHandlers } from './session'

export const handlers = [
  ...sessionHandlers,
  ...marketHandlers,
  ...securityHandlers,
  ...listHandlers,
]
