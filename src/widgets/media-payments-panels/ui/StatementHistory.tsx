import { useTranslation } from 'react-i18next'
import { useStatementHistory } from '@/entities/news-statement'
import { useFormat } from '@/shared/i18n'

/** A statement's history: each status it took, the amount after, the reason, who and who confirmed. */
export function StatementHistory({ id }: { id: string }) {
  const { t } = useTranslation()
  const format = useFormat()
  const history = useStatementHistory(id)
  if (!history.data) return null
  return (
    <ol className="flex flex-col gap-1 font-sans text-caption text-secondary">
      {[...history.data].reverse().map((line) => (
        <li key={line.number}>
          <span className="font-mono">{`${format.date(line.at)} ${format.time(line.at)}`}</span>{' '}
          <span className="text-primary">
            {line.from
              ? t('mediaPayments.statement.historyLine', {
                  from: t(`mediaPayments.statuses.${line.from}`),
                  to: t(`mediaPayments.statuses.${line.to}`),
                })
              : t(`mediaPayments.statuses.${line.to}`)}
          </span>{' '}
          · XAF {format.number(line.amountDue, 0)} ·{' '}
          {line.by?.displayName ?? t('mediaPayments.statement.system')}
          {line.confirmedBy &&
            ` (${t('mediaPayments.statement.confirmedBy', { name: line.confirmedBy.displayName })})`}
          {line.reason && ` · ${line.reason}`}
        </li>
      ))}
    </ol>
  )
}
