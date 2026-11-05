import { accountHandlers } from './account'
import { adminHandlers } from './admin'
import { alertHandlers } from './alerts'
import { analysisHandlers } from './analysis'
import { authHandlers } from './auth'
import { bondHandlers } from './bonds'
import { calendarHandlers } from './calendar'
import { dataHandlers } from './data'
import { directoryHandlers } from './directory'
import { documentHandlers } from './documents'
import { libraryHandlers } from './library'
import { marketHandlers } from './market'
import { networkHandlers } from './network'
import { newsHandlers } from './news'
import { paymentHandlers } from './payments'
import { portfolioHandlers } from './portfolios'
import { publicationHandlers } from './publications'
import { securityHandlers } from './securities'
import { sessionHandlers } from './session'
import { watchlistHandlers } from './watchlists'

// The auth gate comes first: it answers 401 without a valid access token.
export const handlers = [
  ...authHandlers,
  ...sessionHandlers,
  ...accountHandlers,
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
  ...libraryHandlers,
  ...publicationHandlers,
  ...paymentHandlers,
  ...networkHandlers,
  ...directoryHandlers,
  ...dataHandlers,
  ...adminHandlers,
]
