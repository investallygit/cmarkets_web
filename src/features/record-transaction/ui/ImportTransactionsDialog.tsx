import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  IMPORT_TEMPLATE_COLUMNS,
  TRANSACTION_TYPES,
  useImportTransactions,
} from '@/entities/portfolio'
import { isApiError } from '@/shared/api'
import { useFormat } from '@/shared/i18n'
import { downloadCsv } from '@/shared/lib/csv'
import { useMarketDay } from '@/shared/lib/useMarketDay'
import { downloadXlsx } from '@/shared/lib/xlsx'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { FileDrop } from '@/shared/ui/form/FileDrop'
import { toast } from '@/shared/ui/toast'

const MAX_FILE_SIZE = 2 * 1024 * 1024
/** Errors listed at most; the file is fixed and sent again. */
const SHOWN_ERRORS = 20

/** The template's columns and three example rows, dated today so they import as they are. */
function templateRows(today: string): (string | number | null)[][] {
  return [
    [...IMPORT_TEMPLATE_COLUMNS],
    [today, 'deposit', null, null, null, null, 10_000_000, 'Client subscription'],
    [today, 'buy', 'SEMC', 100, 52_500, 31_500, null, null],
    [today, 'buy', 'ECMR 6.25% 29', 500, 101.4, 10_140, null, null],
  ]
}

interface RowError {
  key: string
  line: number | null
  column: string | null
  message: string
}

/** "rows[3].quantity" -> line 3, column quantity; "file" is about the whole file. */
function rowErrors(errors: Record<string, string[]>): RowError[] {
  return Object.entries(errors)
    .flatMap(([key, messages]) => {
      const match = /^rows\[(\d+)\]\.(\w+)$/.exec(key)
      return messages.map((message) => ({
        key: `${key}|${message}`,
        line: match ? Number(match[1]) : null,
        column: match ? match[2] : null,
        message,
      }))
    })
    .sort((a, b) => (a.line ?? 0) - (b.line ?? 0))
}

interface ImportTransactionsDialogProps {
  portfolioId: string
  open: boolean
  onClose: () => void
}

/**
 * Transactions from the CSV or Excel template (spec section 4). The server takes all rows or
 * none, and lists what to fix by line.
 */
export function ImportTransactionsDialog({
  portfolioId,
  open,
  onClose,
}: ImportTransactionsDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onClose={onClose} title={t('portfolio.import.title')} width={520}>
      {open && <ImportForm portfolioId={portfolioId} onClose={onClose} />}
    </Dialog>
  )
}

function ImportForm({ portfolioId, onClose }: { portfolioId: string; onClose: () => void }) {
  const { t } = useTranslation()
  const format = useFormat()
  const [file, setFile] = useState<File | null>(null)
  const importFile = useImportTransactions(portfolioId)
  const today = useMarketDay()
  const errors = isApiError(importFile.error, 400)
    ? rowErrors(importFile.error.problem.errors ?? {})
    : []
  const generalError = importFile.error && errors.length === 0 ? importFile.error.message : null

  const submit = () => {
    if (!file) return
    importFile.mutate(file, {
      onSuccess: (result) => {
        toast.success(
          t('portfolio.import.done', {
            count: result.imported,
            from: result.from ? format.isoDate(result.from) : '',
            to: result.to ? format.isoDate(result.to) : '',
          }),
        )
        onClose()
      },
    })
  }

  return (
    <form
      className="contents"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <DialogBody>
        <p className="font-sans text-label">{t('portfolio.import.intro')}</p>
        <p className="flex flex-wrap items-center gap-2 font-sans text-data text-secondary">
          {t('portfolio.import.template')}
          <Button
            variant="link"
            size="sm"
            onClick={() => downloadCsv('cmarket-transactions-template', templateRows(today))}
          >
            CSV
          </Button>
          <Button
            variant="link"
            size="sm"
            onClick={() => {
              downloadXlsx('cmarket-transactions-template', templateRows(today)).catch(
                (error: unknown) =>
                  toast.error(
                    t('menu.exportFailed', {
                      message: error instanceof Error ? error.message : String(error),
                    }),
                  ),
              )
            }}
          >
            Excel
          </Button>
        </p>
        <p className="font-sans text-data text-secondary">
          {t('portfolio.import.columns', {
            columns: IMPORT_TEMPLATE_COLUMNS.join(' ; '),
            types: TRANSACTION_TYPES.join(', '),
          })}
        </p>
        <Field label={t('portfolio.import.file')}>
          <FileDrop
            file={file}
            onChange={(next) => {
              setFile(next)
              importFile.reset()
            }}
            accept=".csv,.xlsx"
            maxSize={MAX_FILE_SIZE}
          />
        </Field>
        {errors.length > 0 && (
          <div role="alert" className="flex flex-col gap-1">
            <p className="font-sans text-data text-down">
              {t('portfolio.import.rejected', { count: errors.length })}
            </p>
            <ul className="max-h-48 overflow-auto border p-2 font-mono text-data">
              {errors.slice(0, SHOWN_ERRORS).map((error) => (
                <li key={error.key}>
                  {error.line === null
                    ? error.message
                    : t('portfolio.import.rowError', {
                        line: error.line,
                        column: error.column,
                        message: error.message,
                      })}
                </li>
              ))}
            </ul>
          </div>
        )}
        {generalError && (
          <p role="alert" className="font-sans text-data text-down">
            {generalError}
          </p>
        )}
      </DialogBody>
      <DialogFooter>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" variant="primary" disabled={!file} busy={importFile.isPending}>
          {t('portfolio.import.submit')}
        </Button>
      </DialogFooter>
    </form>
  )
}
