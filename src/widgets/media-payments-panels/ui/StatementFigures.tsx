import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { NewsStatementDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'

/**
 * A statement's figures as the right panel of the mockup lists them: unique, excluded and payable
 * clicks, the gross amount at the rate, the cap applied, what the month before carried, the
 * amount due; then its items by type and the most clicked ones.
 */
export function StatementFigures({ statement }: { statement: NewsStatementDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const whole = (value: number) => format.number(value, 0)
  const xaf = (value: number) => `XAF ${whole(value)}`
  return (
    <div className="flex flex-col">
      <dl className="flex flex-col font-sans text-data">
        <Row label={t('mediaPayments.statement.clicks')}>
          {`${whole(statement.uniqueClicks)} · ${whole(statement.excludedClicks)} · ${whole(statement.payableClicks)}`}
        </Row>
        <Row
          label={t('mediaPayments.statement.gross', {
            payable: whole(statement.payableClicks),
            rate: whole(statement.ratePerClick),
          })}
        >
          {xaf(statement.grossAmount)}
        </Row>
        {statement.capApplied && statement.monthlyCap !== null && (
          <Row label={t('mediaPayments.statement.capApplied')}>{xaf(statement.monthlyCap)}</Row>
        )}
        {statement.carriedIn > 0 && (
          <Row label={t('mediaPayments.statement.carriedIn')}>{xaf(statement.carriedIn)}</Row>
        )}
        <Row label={t('mediaPayments.statement.due')} tone="text-up">
          {xaf(statement.amountDue)}
        </Row>
        {statement.carriedOver > 0 && (
          <Row label={t('mediaPayments.statement.carriedOver')} tone="text-accent-amber">
            {xaf(statement.carriedOver)}
          </Row>
        )}
        <Row label={t('mediaPayments.statement.items')}>
          {t('mediaPayments.statement.itemsValue', {
            items: whole(statement.items),
            articles: whole(statement.articleItems),
            flashes: whole(statement.flashItems),
          })}
        </Row>
      </dl>
      {statement.topItems.length > 0 && (
        <div className="px-3 pt-2">
          <p className="font-sans text-caption font-semibold uppercase tracking-title text-accent-amber">
            {t('mediaPayments.statement.topItems')}
          </p>
          <ol className="flex flex-col font-sans text-data">
            {statement.topItems.map((item) => (
              <li key={item.newsId} className="flex justify-between gap-3 py-0.5">
                <span className="truncate text-secondary">{item.headline}</span>
                <span className="shrink-0 font-mono text-primary">{whole(item.payableClicks)}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

function Row({ label, tone, children }: { label: string; tone?: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-3 py-1 odd:bg-row-alt">
      <dt className="text-secondary">{label}</dt>
      <dd className={`font-mono ${tone ?? 'text-primary'}`}>{children}</dd>
    </div>
  )
}
