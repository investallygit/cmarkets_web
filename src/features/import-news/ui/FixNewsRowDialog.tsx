import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFixNewsImportRow } from '@/entities/news'
import { isApiError } from '@/shared/api'
import {
  NEWS_IMPORT_COLUMNS,
  type NewsImportColumn,
  type NewsImportRowDto,
} from '@/shared/api/contracts'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { Textarea } from '@/shared/ui/form/Textarea'
import { TextInput } from '@/shared/ui/form/TextInput'
import { toast } from '@/shared/ui/toast'
import { issueText } from '../lib/issueText'

/** The long cells, typed on several lines. */
const LONG: ReadonlySet<NewsImportColumn> = new Set(['summary', 'body'])

interface FixNewsRowDialogProps {
  importId: string
  row: NewsImportRowDto | null
  onClose: () => void
}

/** Fix row: the cells of a row in error typed again; the server checks the rows waiting again. */
export function FixNewsRowDialog({ importId, row, onClose }: FixNewsRowDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog
      open={row !== null}
      onClose={onClose}
      title={row ? t('newsStudio.import.fixTitle', { line: row.line }) : ''}
      width={560}
    >
      {row && <FixNewsRowForm importId={importId} row={row} onClose={onClose} />}
    </Dialog>
  )
}

function FixNewsRowForm({
  importId,
  row,
  onClose,
}: FixNewsRowDialogProps & { row: NewsImportRowDto }) {
  const { t } = useTranslation()
  const fix = useFixNewsImportRow(importId)
  // The cells the file filled, and those the checks are about.
  const shown = NEWS_IMPORT_COLUMNS.filter(
    (column) =>
      row.values[column] !== undefined || row.issues.some((issue) => issue.column === column),
  )
  const [values, setValues] = useState<Partial<Record<NewsImportColumn, string>>>(() =>
    Object.fromEntries(shown.map((column) => [column, row.values[column] ?? ''])),
  )
  const error = fix.error && !isApiError(fix.error, 400) ? fix.error.message : null

  return (
    <form
      className="contents"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        fix.mutate(
          {
            rowId: row.id,
            fix: {
              values: Object.fromEntries(
                shown.map((column) => [column, values[column]?.trim() || null]),
              ),
            },
          },
          {
            onSuccess: (checked) => {
              if (checked.status === 'valid') {
                toast.success(t('newsStudio.import.fixed', { line: checked.line }))
                onClose()
              } else toast.error(t('newsStudio.import.stillWrong', { line: checked.line }))
            },
          },
        )
      }}
    >
      <DialogBody>
        <div className="grid gap-x-3 gap-y-2 sm:grid-cols-2">
          {shown.map((column) => {
            const issue = row.issues.find((candidate) => candidate.column === column)
            const Control = LONG.has(column) ? Textarea : TextInput
            return (
              <Field
                key={column}
                label={t(`newsStudio.import.columns.${column}`)}
                error={issue ? issueText(t, issue) : undefined}
                className={LONG.has(column) ? 'sm:col-span-2' : undefined}
              >
                <Control
                  value={values[column] ?? ''}
                  onChange={(value: string) =>
                    setValues((current) => ({ ...current, [column]: value }))
                  }
                  highlight={Boolean(issue)}
                  {...(LONG.has(column) ? { rows: 3 } : { mono: true })}
                />
              </Field>
            )
          })}
        </div>
        {error && (
          <p role="alert" className="font-sans text-data text-down">
            {error}
          </p>
        )}
      </DialogBody>
      <DialogFooter>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" variant="primary" busy={fix.isPending}>
          {t('newsStudio.import.fixSave')}
        </Button>
      </DialogFooter>
    </form>
  )
}
