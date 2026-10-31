import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { ImportColumnDto, ImportIssueDto, ImportValues } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { isChangeField, isImportColumn } from '../config/importTypes'

type Value = ImportValues[string]

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** The name of a template column in the user's language; the file's name when not a template one. */
export function useColumnLabel() {
  const { t } = useTranslation()
  return useCallback(
    (name: string) => (isImportColumn(name) ? t(`dataImport.columns.${name}`) : name),
    [t],
  )
}

/** A cell of an upload as the screen shows it: dates and figures in the user's format. */
export function useImportCell() {
  const format = useFormat()
  return useCallback(
    (column: Pick<ImportColumnDto, 'name' | 'kind'>, value: Value): string => {
      if (value === null || value === undefined || value === '') return ''
      if (typeof value === 'string') {
        if (column.kind === 'date' && ISO_DATE.test(value)) return format.isoDate(value)
        if (column.name === 'country' && /^[A-Z]{2}$/.test(value)) return format.country(value)
        return value
      }
      if (column.kind === 'rate') return format.percent(value, 2, false)
      if (column.kind === 'integer') return format.number(value, 0)
      return format.number(value, Number.isInteger(value) ? 0 : 2)
    },
    [format],
  )
}

/** The reason of a check in the user's language, from its code and its figures (spec section 11). */
export function useIssueText() {
  const { t } = useTranslation()
  const format = useFormat()
  const columnLabel = useColumnLabel()
  return useCallback(
    (issue: ImportIssueDto): string => {
      const { params } = issue
      const column = issue.column ? columnLabel(issue.column) : ''
      const number = (key: string, decimals = 2) =>
        format.number(Number(params[key] ?? 0), decimals)
      const day = (key: string) => format.isoDate(String(params[key] ?? ''))
      switch (issue.code) {
        case 'changeAboveThreshold': {
          const pct = params.unit === 'pct'
          const field = String(params.field)
          return t('dataImport.issues.changeAboveThreshold', {
            field: isChangeField(field) ? t(`dataImport.issueFields.${field}`) : field,
            change: pct
              ? format.percent(Number(params.change), 2, true)
              : t('dataImport.points', { value: format.signed(Number(params.change), 2) }),
            threshold: pct
              ? format.percent(Number(params.threshold), 0, false)
              : number('threshold'),
          })
        }
        case 'zeroVolumeChanged':
          return t('dataImport.issues.zeroVolumeChanged', { previous: number('previous') })
        case 'duplicate':
          // Rows count from the first line after the header.
          return t('dataImport.issues.duplicate', {
            row: format.number(Number(params.line) - 1, 0),
          })
        case 'notASession':
          return t('dataImport.issues.notASession', { date: day('date') })
        case 'otherSession':
          return t('dataImport.issues.otherSession', { date: day('date'), session: day('session') })
        default:
          return t(`dataImport.issues.${issue.code}`, {
            column,
            text: String(params.text ?? ''),
            code: String(params.code ?? ''),
          })
      }
    },
    [t, format, columnLabel],
  )
}
