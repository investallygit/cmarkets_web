import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import type { ImportCountsDto, ImportRowStatus } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'

interface Counter {
  key: 'read' | 'new' | 'changed' | 'unchanged' | 'alerts' | 'errors'
  filter: ImportRowStatus | null
  tone: (counts: ImportCountsDto) => string
}

const COUNTERS: readonly Counter[] = [
  { key: 'read', filter: null, tone: () => 'text-primary' },
  { key: 'new', filter: 'new', tone: () => 'text-up' },
  { key: 'changed', filter: 'changed', tone: () => 'text-primary' },
  { key: 'unchanged', filter: 'unchanged', tone: () => 'text-secondary' },
  {
    key: 'alerts',
    filter: 'alert',
    tone: (counts) => (counts.alerts > 0 ? 'text-warning' : 'text-up'),
  },
  {
    key: 'errors',
    filter: 'error',
    tone: (counts) => (counts.errors > 0 ? 'text-down' : 'text-up'),
  },
]

/** Rows read, new, changed, unchanged, alerts, errors; a click shows those rows only. */
export function ImportCounters({
  counts,
  filter,
  onFilter,
}: {
  counts: ImportCountsDto
  filter: ImportRowStatus | null
  onFilter: (filter: ImportRowStatus | null) => void
}) {
  const { t } = useTranslation()
  const format = useFormat()
  return (
    <div className="grid grid-cols-6 gap-2 px-3 pb-2">
      {COUNTERS.map((counter) => {
        const active = counter.filter !== null && counter.filter === filter
        return (
          <button
            key={counter.key}
            type="button"
            aria-pressed={counter.filter === null ? filter === null : active}
            onClick={() => onFilter(active ? null : counter.filter)}
            className={clsx(
              'grid justify-items-start border-b-2 px-1 pb-0.5 text-left hover:bg-panel-header',
              active ? 'border-accent-amber' : 'border-transparent',
            )}
          >
            <span className="font-sans text-data text-secondary">
              {t(`dataImport.counters.${counter.key}`)}
            </span>
            <span className={clsx('font-mono text-figure', counter.tone(counts))}>
              {format.number(counts[counter.key], 0)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
