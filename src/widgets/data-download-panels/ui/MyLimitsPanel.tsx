import { useTranslation } from 'react-i18next'
import type { AccountType, ExportLimitsDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'

/**
 * DL's "My limits" (spec section 9, screen 30): the profile's downloads a day and today's, rows a
 * file, the history it reaches, the scheduled exports; the terms of use under them.
 */
export function MyLimitsPanel({ limits }: { limits: ExportLimitsDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const unlimited = t('downloads.limits.unlimited')
  const profile = t(`accountBadge.${limits.profile as AccountType}`)
  const rows: [string, string][] = [
    [
      t('downloads.limits.perDay'),
      limits.perDay === null
        ? `${limits.usedToday} / ${unlimited}`
        : `${limits.usedToday} / ${limits.perDay}`,
    ],
    [
      t('downloads.limits.rowsPerFile'),
      (limits.rowsPerFile === null ? unlimited : format.number(limits.rowsPerFile, 0)) +
        (limits.csvOnly ? ` (${t('downloads.limits.csvOnly')})` : ''),
    ],
    [
      t('downloads.limits.history'),
      limits.earliest
        ? t('downloads.limits.since', { date: format.isoDate(limits.earliest) })
        : t('downloads.limits.fullHistory'),
    ],
    [t('downloads.limits.schedules'), `${limits.schedulesUsed} / ${limits.schedules ?? unlimited}`],
  ]
  return (
    <Panel
      title={t('panels.myLimits')}
      code="DL"
      options={<span>{t('downloads.limits.profile', { profile })}</span>}
      bodyClassName="flex flex-col"
    >
      <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-2.5 px-3 py-3 font-sans text-data">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-secondary">{label}</dt>
            <dd className="text-right font-mono">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-auto px-3 py-3 font-sans text-caption text-accent-amber">
        {t('downloads.limits.terms')}
      </p>
    </Panel>
  )
}
