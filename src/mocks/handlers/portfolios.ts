import { manageHandlers } from './portfolios/manage'
import { reportHandlers } from './portfolios/reports'
import { transactionHandlers } from './portfolios/transactions'
import { valuationHandlers } from './portfolios/valuation'

/**
 * PORT (screen 5): the user's portfolios, their transactions, the figures of the panels (spec
 * sections 14.2 and 14.3) and the PDF reports. One module per part in ./portfolios.
 */
export const portfolioHandlers = [
  ...manageHandlers,
  ...valuationHandlers,
  ...transactionHandlers,
  ...reportHandlers,
]
