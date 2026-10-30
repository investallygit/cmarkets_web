import type { TFunction } from 'i18next'
import { Pencil, Trash2 } from 'lucide-react'
import { useContext, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  isTrade,
  openPortfolioDialog,
  openTransactionDialog,
  TRANSACTION_TYPES,
  usePortfolio,
  useTransactions,
} from '@/entities/portfolio'
import { useHasPermission } from '@/entities/session'
import { DeleteTransactionDialog } from '@/features/record-transaction'
import type { TransactionDto, TransactionType } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { ChangeText } from '@/shared/ui/ChangeText'
import { createDataColumnHelper, type DataColumns } from '@/shared/ui/dataColumns'
import { DataTable, type TableExporter } from '@/shared/ui/DataTable'
import { Button } from '@/shared/ui/form/Button'
import { Panel } from '@/shared/ui/Panel'
import { PanelSelect, type PanelSelectOption } from '@/shared/ui/PanelSelect'
import { QueryView } from '@/shared/ui/QueryView'
import { PanelEmpty } from '@/shared/ui/StatusViews'
import { TableExportContext } from '@/shared/ui/tableExport'

const helper = createDataColumnHelper<TransactionDto>()
const getId = (transaction: TransactionDto) => transaction.id
const ALL = 'all'

function buildColumns(
  t: TFunction,
  format: ReturnType<typeof useFormat>,
  currency: string,
): DataColumns<TransactionDto> {
  const amountDecimals = currency === 'XAF' ? 0 : 2
  return [
    helper.accessor('date', {
      header: t('columns.date'),
      meta: { width: '96px' },
      cell: ({ getValue }) => format.isoDate(getValue()),
    }),
    helper.accessor((transaction) => t(`portfolio.transactionTypes.${transaction.type}`), {
      id: 'type',
      header: t('columns.type'),
      meta: { width: '1.1fr' },
      cell: ({ getValue }) => <span className="font-sans">{getValue()}</span>,
    }),
    helper.accessor((transaction) => transaction.securityCode ?? '', {
      id: 'security',
      header: t('columns.security'),
      meta: { width: '1.2fr' },
      cell: ({ getValue }) => <span className="text-accent-amber">{getValue()}</span>,
    }),
    helper.accessor((transaction) => transaction.quantity ?? undefined, {
      id: 'quantity',
      header: t('columns.quantity'),
      meta: { align: 'right' },
      sortUndefined: 'last',
      cell: ({ getValue }) => {
        const value = getValue()
        return value === undefined ? '' : format.number(value, 0)
      },
    }),
    helper.accessor((transaction) => transaction.price ?? undefined, {
      id: 'price',
      header: t('columns.price'),
      meta: { align: 'right' },
      sortUndefined: 'last',
      cell: ({ getValue }) => {
        const value = getValue()
        return value === undefined ? '' : format.number(value, Number.isInteger(value) ? 0 : 2)
      },
    }),
    helper.accessor('fees', {
      header: t('portfolio.transactions.fees'),
      meta: { align: 'right', width: '0.8fr' },
      cell: ({ row, getValue }) => (isTrade(row.original.type) ? format.number(getValue(), 0) : ''),
    }),
    helper.accessor('amount', {
      header: t('portfolio.transactions.amount', { currency }),
      meta: { align: 'right', width: '1.3fr' },
      cell: ({ getValue }) => format.signed(getValue(), amountDecimals),
    }),
    helper.accessor((transaction) => transaction.realizedGain ?? undefined, {
      id: 'realizedGain',
      header: t('portfolio.transactions.realized'),
      meta: { align: 'right', width: '1.1fr' },
      sortUndefined: 'last',
      cell: ({ getValue }) => {
        const value = getValue()
        return value === undefined ? '' : <ChangeText value={value} decimals={amountDecimals} />
      },
    }),
    helper.accessor('note', {
      header: t('portfolio.transactions.note'),
      meta: { width: '1.6fr' },
      cell: ({ getValue }) => <span className="font-sans text-secondary">{getValue()}</span>,
    }),
  ]
}

interface PortfolioTransactionsPanelProps {
  portfolioId: string
  onImport?: () => void
}

/**
 * Screen 5, Transactions tab: the history, newest first, with the gain each sale realized; a
 * right-click corrects or deletes a transaction. API GET /portfolios/{id}/transactions.
 */
export function PortfolioTransactionsPanel({
  portfolioId,
  onImport,
}: PortfolioTransactionsPanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const canExport = useContext(TableExportContext)
  const canWrite = useHasPermission('portfolios:write')
  const exportRef = useRef<TableExporter | null>(null)
  const [type, setType] = useState<TransactionType | typeof ALL>(ALL)
  const [deleting, setDeleting] = useState<TransactionDto | null>(null)
  const portfolio = usePortfolio(portfolioId).data
  const transactions = useTransactions(portfolioId)
  const currency = portfolio?.currency ?? ''
  const columns = useMemo(() => buildColumns(t, format, currency), [t, format, currency])
  const typeOptions = useMemo(
    (): PanelSelectOption<TransactionType | typeof ALL>[] => [
      { value: ALL, label: t('portfolio.transactions.allTypes') },
      ...TRANSACTION_TYPES.map((value) => ({
        value,
        label: t(`portfolio.transactionTypes.${value}`),
      })),
    ],
    [t],
  )

  if (portfolio?.kind === 'model') {
    return (
      <Panel title={t('panels.transactions')} code="PORT">
        <div className="flex h-full flex-col items-center justify-center gap-3 p-4">
          <PanelEmpty message={t('portfolio.transactions.model')} />
          {canWrite && (
            <Button onClick={() => openPortfolioDialog({ mode: 'edit', portfolio })}>
              {t('portfolio.editAllocation')}
            </Button>
          )}
        </div>
      </Panel>
    )
  }

  const edit = (transaction: TransactionDto) => openTransactionDialog({ portfolioId, transaction })

  return (
    <Panel
      title={t('panels.transactions')}
      code="PORT"
      options={
        <>
          <PanelSelect
            value={type}
            options={typeOptions}
            onChange={setType}
            aria-label={t('portfolio.transactions.typeFilter')}
          />
          {canExport && (
            <span className="panel-no-drag flex items-center gap-1.5">
              <span aria-hidden>·</span>
              <span>{t('portfolio.positions.export')}</span>
              <button
                type="button"
                onClick={() => exportRef.current?.('xlsx')}
                className="hover:text-primary"
              >
                XLSX
              </button>
              <span aria-hidden>·</span>
              <button
                type="button"
                onClick={() => exportRef.current?.('csv')}
                className="hover:text-primary"
              >
                CSV
              </button>
            </span>
          )}
          {canWrite && onImport && (
            <span className="panel-no-drag flex items-center gap-1.5">
              <span aria-hidden>·</span>
              <button type="button" onClick={onImport} className="uppercase hover:text-primary">
                {t('portfolio.positions.import')}
              </button>
            </span>
          )}
        </>
      }
    >
      <QueryView query={transactions}>
        {(data) => (
          <DataTable
            data={type === ALL ? data : data.filter((transaction) => transaction.type === type)}
            columns={columns}
            getRowId={getId}
            onRowDoubleClick={canWrite ? edit : undefined}
            rowMenu={
              canWrite
                ? (transaction) => [
                    {
                      id: 'edit',
                      label: t('portfolio.transactions.edit'),
                      icon: Pencil,
                      onSelect: () => edit(transaction),
                    },
                    {
                      id: 'delete',
                      label: t('portfolio.transactions.delete'),
                      icon: Trash2,
                      onSelect: () => setDeleting(transaction),
                    },
                  ]
                : undefined
            }
            exportName="port-transactions"
            exportRef={exportRef}
            emptyMessage={t('portfolio.transactions.empty')}
          />
        )}
      </QueryView>
      <DeleteTransactionDialog
        portfolioId={portfolioId}
        transaction={deleting}
        onClose={() => setDeleting(null)}
      />
    </Panel>
  )
}
