import { clsx } from 'clsx'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCoverage } from '@/entities/data-import'
import type { CoverageItemDto, CoverageStatus } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { addDays, isWeekend } from '@/shared/lib/isoDate'
import { Button } from '@/shared/ui/form/Button'
import { DateInput } from '@/shared/ui/form/DateInput'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { ScrollArea } from '@/shared/ui/ScrollArea'
import { TemplatesDialog } from './TemplatesDialog'

interface SessionCoveragePanelProps {
  /** The session shown; the current one when null. */
  date?: string | null
  /** DATA: a session picker above the list. */
  onDateChange?: (date: string) => void
  /** Opens the latest upload of a file in the current upload panel. */
  onOpenImport?: (importId: string) => void
}

const TONES: Record<CoverageStatus, string> = {
  published: 'text-up',
  checking: 'text-warning',
  expected: 'text-secondary',
  missing: 'text-down',
  none: 'text-secondary',
}

/** Green when published, half yellow while checked, empty when expected or not expected. */
function StatusDot({ status }: { status: CoverageStatus }) {
  return (
    <span
      aria-hidden
      className={clsx(
        'mt-1 size-2.5 shrink-0 rounded-full border',
        status === 'published' && 'border-up bg-up',
        status === 'checking' &&
          'border-warning bg-[linear-gradient(90deg,var(--color-warning)_50%,transparent_50%)]',
        status === 'missing' && 'border-down',
        (status === 'expected' || status === 'none') && 'border-secondary',
      )}
    />
  )
}

/** The weekday before or after, skipping the weekend. */
function sessionAfter(day: string, step: 1 | -1): string {
  let next = addDays(day, step)
  while (isWeekend(next)) next = addDays(next, step)
  return next
}

/**
 * Screen 6, session coverage (GET /data/coverage): the files expected for the session and where
 * each one stands, the news entered, and the templates to download.
 */
export function SessionCoveragePanel({
  date = null,
  onDateChange,
  onOpenImport,
}: SessionCoveragePanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const coverage = useCoverage(date)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const shown = coverage.data?.date ?? date

  const statusText = (item: CoverageItemDto, session: string) => {
    switch (item.status) {
      case 'published':
        if (item.type === 'news') return t('dataImport.coverage.news', { count: item.published })
        return item.type === 'daily-prices' || item.type === 'indices'
          ? t('dataImport.coverage.publishedAt', { time: format.time(item.lastPublishedAt ?? '') })
          : t('dataImport.coverage.files', { count: item.published })
      case 'checking':
        return t('dataImport.coverage.checking')
      case 'expected': {
        const today = !item.dueOn || item.dueOn === session
        // A file due at a time of Douala (UTC+1 all year), shown in the user's time zone: the CEMAC
        // sovereign yields at 17:30, as the screen 6 mockup expects them.
        if (item.dueOn && item.dueTime) {
          const time = format.time(`${item.dueOn}T${item.dueTime}:00+01:00`)
          return today
            ? t('dataImport.coverage.expectedAt', { time })
            : t('dataImport.coverage.expectedOnAt', {
                day: format.weekday(item.dueOn, 'long'),
                time,
              })
        }
        return today
          ? t('dataImport.coverage.expectedToday')
          : t('dataImport.coverage.expectedOn', {
              day: format.weekday(item.dueOn ?? session, 'long'),
            })
      }
      case 'missing':
        return t('dataImport.coverage.missing')
      case 'none':
        return item.type === 'news'
          ? t('dataImport.coverage.noneNews')
          : t('dataImport.coverage.noneExpected')
    }
  }

  return (
    <Panel
      title={t('panels.sessionCoverage')}
      code="DATA"
      options={shown && <span className="normal-case">{format.isoDate(shown)}</span>}
      bodyClassName="flex flex-col"
    >
      {onDateChange && shown && (
        <div className="flex items-center gap-1 border-b p-2">
          <span className="mr-1 font-sans text-data text-secondary">
            {t('dataImport.coverage.session')}
          </span>
          <Button
            size="sm"
            icon={ChevronLeft}
            aria-label={t('dataImport.coverage.previousSession')}
            onClick={() => onDateChange(sessionAfter(shown, -1))}
          />
          <DateInput
            value={shown}
            onChange={(value) => value && onDateChange(value)}
            aria-label={t('dataImport.coverage.session')}
            className="w-28"
          />
          <Button
            size="sm"
            icon={ChevronRight}
            aria-label={t('dataImport.coverage.nextSession')}
            onClick={() => onDateChange(sessionAfter(shown, 1))}
          />
        </div>
      )}
      <ScrollArea className="min-h-0 flex-1">
        <QueryView query={coverage}>
          {({ date: session, items }) => (
            <ul>
              {items.map((item, index) => {
                const content = (
                  <>
                    <StatusDot status={item.status} />
                    <span className="grid min-w-0 gap-0.5 text-left">
                      <span className="truncate font-sans text-label text-primary">
                        {t(`dataImport.types.${item.type}`)}
                      </span>
                      <span className={clsx('truncate font-mono text-data', TONES[item.status])}>
                        {statusText(item, session)}
                      </span>
                    </span>
                  </>
                )
                const row = clsx(
                  'flex w-full items-start gap-3 px-3 py-1.5',
                  index % 2 === 1 && 'bg-row-alt',
                )
                return (
                  <li key={item.type}>
                    {onOpenImport && item.importId ? (
                      <button
                        type="button"
                        className={clsx(row, 'hover:bg-panel-header')}
                        title={t('dataImport.coverage.open')}
                        onClick={() => item.importId && onOpenImport(item.importId)}
                      >
                        {content}
                      </button>
                    ) : (
                      <div className={row}>{content}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </QueryView>
      </ScrollArea>
      <div className="shrink-0 p-2">
        <Button variant="info" className="w-full" onClick={() => setTemplatesOpen(true)}>
          {t('dataImport.templates.download')}
        </Button>
      </div>
      <TemplatesDialog open={templatesOpen} onClose={() => setTemplatesOpen(false)} />
    </Panel>
  )
}
