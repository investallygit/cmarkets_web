import { useNavigate } from 'react-router'
import { usePortfolioDialog } from '@/entities/portfolio'
import { portfolioPath } from '@/shared/routes/paths'
import { PortfolioDialog } from './PortfolioDialog'

/** The portfolio form asked for from the screen (openPortfolioDialog); a new one opens. */
export function PortfolioDialogHost() {
  const navigate = useNavigate()
  const request = usePortfolioDialog((state) => state.request)
  const close = usePortfolioDialog((state) => state.close)
  return (
    <PortfolioDialog
      request={request}
      onClose={close}
      onSaved={(portfolio) => {
        if (request?.mode === 'create') void navigate(portfolioPath(portfolio.id))
      }}
    />
  )
}
