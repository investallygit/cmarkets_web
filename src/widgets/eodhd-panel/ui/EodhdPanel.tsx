import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useEodhdStatus } from '@/entities/data-provider'
import type { EodhdRunDto, EodhdStatusDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

const STATUS_TONES: Record<EodhdStatusDto['status'], string> = {
  operational: 'text-up',
  degraded: 'text-warning',
  down: 'text-down',
}

const MISSING = '—'

/**
 * Screen 6, EODHD connector (GET /data/providers/eodhd/status): its state, the latest bulk loads,
 * the calls of the day against the quota, the 429 answers and the last error. The key stays on
 * the server (spec section 11).
 */
export function EodhdPanel({ detailed = false }: { detailed?: boolean }) {
  const { t } = useTranslation()
  const format = useFormat()
  const status = useEodhdStatus()
  const when = (iso: string) => `${format.dayMonth(iso)} ${format.time(iso)}`
  const loadTime = (run: EodhdRunDto | undefined) =>
    run ? (
      <span className={run.status === 'failed' ? 'text-down' : undefined}>
        {when(run.startedAt)}
      </span>
    ) : (
      MISSING
    )

  return (
    <Panel
      title={t('panels.eodhd')}
      code="EODH"
      options={<span>{t('eodhd.regions')}</span>}
      bodyClassName="flex flex-col"
    >
      <QueryView query={status}>
        {(data) => {
          const used = data.dailyQuota > 0 ? (data.callsToday / data.dailyQuota) * 100 : 0
          const latest = (job: EodhdRunDto['job']) => data.latest.find((run) => run.job === job)
          const rows: [string, ReactNode][] = [
            [
              t('eodhd.status'),
              <span className={STATUS_TONES[data.status]}>
                {t(`eodhd.statuses.${data.status}`)}
              </span>,
            ],
            [t('eodhd.jobs.us-eod'), loadTime(latest('us-eod'))],
            [t('eodhd.jobs.europe-eod'), loadTime(latest('europe-eod'))],
            [t('eodhd.jobs.fundamentals'), loadTime(latest('fundamentals'))],
            [t('eodhd.callsToday'), format.number(data.callsToday, 0)],
            [t('eodhd.quotaUsed'), format.percent(used, 0, false)],
            [
              t('eodhd.rateLimited'),
              <span className={data.rateLimited24h > 0 ? 'text-warning' : 'text-up'}>
                {format.number(data.rateLimited24h, 0)}
              </span>,
            ],
            [
              t('eodhd.lastError'),
              data.lastError ? (
                <span className="text-down" title={data.lastError.message}>
                  {when(data.lastError.at)}
                </span>
              ) : (
                MISSING
              ),
            ],
            ...(detailed
              ? ([
                  [
                    t('eodhd.quota'),
                    t('eodhd.quotaOf', {
                      used: format.number(data.callsToday, 0),
                      quota: format.number(data.dailyQuota, 0),
                    }),
                  ],
                  [t('eodhd.checkedAt'), format.time(data.checkedAt, true)],
                ] satisfies [string, ReactNode][])
              : []),
          ]
          return (
            <>
              <dl>
                {rows.map(([label, value], index) => (
                  <div
                    key={label}
                    className={clsx(
                      'flex h-7.5 items-center gap-3 px-3',
                      index % 2 === 1 && 'bg-row-alt',
                    )}
                  >
                    <dt className="truncate font-sans text-label text-secondary">{label}</dt>
                    <dd className="ml-auto truncate font-mono text-data">{value}</dd>
                  </div>
                ))}
              </dl>
              {data.lastError && detailed && (
                <p className="px-3 py-1 font-mono text-data text-down">{data.lastError.message}</p>
              )}
              <div className="mt-auto px-3 pt-3 pb-4">
                <div
                  role="progressbar"
                  aria-label={t('eodhd.quotaUsed')}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(used)}
                  className="h-2 bg-panel-header"
                >
                  <div
                    className={clsx(
                      'h-full',
                      used >= 90 ? 'bg-down' : used >= 75 ? 'bg-warning' : 'bg-info',
                    )}
                    style={{ width: `${Math.min(100, used)}%` }}
                  />
                </div>
              </div>
            </>
          )
        }}
      </QueryView>
    </Panel>
  )
}
