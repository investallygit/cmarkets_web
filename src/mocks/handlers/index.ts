import { alertHandlers } from './alerts'
import { analysisHandlers } from './analysis'
import { bondHandlers } from './bonds'
import { calendarHandlers } from './calendar'
import { documentHandlers } from './documents'
import { marketHandlers } from './market'
import { newsHandlers } from './news'
import { portfolioHandlers } from './portfolios'
import { securityHandlers } from './securities'
import { sessionHandlers } from './session'
import { watchlistHandlers } from './watchlists'

export const handlers = [
  ...sessionHandlers,
  ...marketHandlers,
  ...securityHandlers,
  ...analysisHandlers,
  ...bondHandlers,
  ...documentHandlers,
  ...newsHandlers,
  ...calendarHandlers,
  ...watchlistHandlers,
  ...alertHandlers,
  ...portfolioHandlers,
]
