import { alertHandlers } from './alerts'
import { calendarHandlers } from './calendar'
import { documentHandlers } from './documents'
import { marketHandlers } from './market'
import { newsHandlers } from './news'
import { securityHandlers } from './securities'
import { sessionHandlers } from './session'
import { watchlistHandlers } from './watchlists'

export const handlers = [
  ...sessionHandlers,
  ...marketHandlers,
  ...securityHandlers,
  ...documentHandlers,
  ...newsHandlers,
  ...calendarHandlers,
  ...watchlistHandlers,
  ...alertHandlers,
]
