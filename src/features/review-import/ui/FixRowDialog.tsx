import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useColumnLabel, useIssueText, usePatchImportRow } from '@/entities/data-import'
import { isApiError } from '@/shared/api'
import type { ImportColumnDto, ImportDto, ImportRowDto, ImportValues } from '@/shared/api/contracts'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { TextInput } from '@/shared/ui/form/TextInput'

interface FixRowDialogProps {
  upload: ImportDto
  row: ImportRowDto | null
  columns: readonly ImportColumnDto[]
  onClose: () => void
}

/** A cell as typed again: dates as DD/MM/YYYY, figures as the file wrote them. */
function asText(column: ImportColumnDto, value: ImportValues[string]): string {
  if (value === null || value === undefined) return ''
  const text = String(value)
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text)
  return column.kind === 'date' && iso ? `${iso[3]}/${iso[2]}/${iso[1]}` : text
}

/** Fix row: the cells of a row typed again; the server checks the whole file again. */
export function FixRowDialog({ upload, row, columns, onClose }: FixRowDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog
      open={row !== null}
      onClose={onClose}
      title={row ? t('dataImport.fix.title', { row: row.line - 1 }) : ''}
      width={520}
    >
      {row && <FixRowForm upload={upload} row={row} columns={columns} onClose={onClose} />}
    </Dialog>
  )
}

function FixRowForm({
  upload,
  row,
  columns,
  onClose,
}: Omit<FixRowDialogProps, 'row'> & { row: ImportRowDto }) {
  const { t } = useTranslation()
  const issueText = useIssueText()
  const columnLabel = useColumnLabel()
  const patch = usePatchImportRow(upload.id)
  const shown = columns.filter((column) => upload.columns.includes(column.name) || column.required)
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      shown.map((column) => [column.name, asText(column, row.values[column.name])]),
    ),
  )
  const issueOf = (name: string) => row.issues.find((issue) => issue.column === name)
  const otherIssues = row.issues.filter((issue) => !issue.column)
  const error = patch.error && !isApiError(patch.error, 400) ? patch.error.message : null

  return (
    <form
      className="contents"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        const changed: ImportValues = Object.fromEntries(
          shown.map((column) => [column.name, values[column.name].trim() || null]),
        )
        patch.mutate({ rowId: row.id, patch: { values: changed } }, { onSuccess: onClose })
      }}
    >
      <DialogBody>
        <p className="font-sans text-data text-secondary">{t('dataImport.fix.hint')}</p>
        {otherIssues.map((issue) => (
          <p key={issue.code} className="font-sans text-data text-down">
            {issueText(issue)}
          </p>
        ))}
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          {shown.map((column) => {
            const issue = issueOf(column.name)
            return (
              <Field
                key={column.name}
                label={columnLabel(column.name)}
                error={issue?.severity === 'error' ? issueText(issue) : undefined}
                hint={issue?.severity === 'alert' ? issueText(issue) : undefined}
              >
                <TextInput
                  value={values[column.name]}
                  onChange={(value) =>
                    setValues((current) => ({ ...current, [column.name]: value }))
                  }
                  mono
                  highlight
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
        <Button type="submit" variant="primary" busy={patch.isPending}>
          {t('dataImport.fix.save')}
        </Button>
      </DialogFooter>
    </form>
  )
}
