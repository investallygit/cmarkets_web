import { useTransactionDialog } from '@/entities/portfolio'
import { TransactionDialog } from './TransactionDialog'

/** The transaction form asked for from the portfolio screen (openTransactionDialog). */
export function TransactionDialogHost() {
  const request = useTransactionDialog((state) => state.request)
  const close = useTransactionDialog((state) => state.close)
  return <TransactionDialog request={request} onClose={close} />
}
