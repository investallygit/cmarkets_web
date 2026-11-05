import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import { useDirectoryReports } from '@/entities/moderation'
import type { ReportedItemDto } from '@/shared/api/contracts'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { reportKey } from '../model/reportKey'
import { useReportText } from '../model/useReportText'
import { ReportTags } from './ReportTags'

interface DirectoryReportsPanelProps {
  selectedKey: string | null
  onOpen: (item: ReportedItemDto) => void
}

/**
 * MOD, the reports of the directory and the messaging (spec section 15): the profiles and the
 * conversations reported, the accounts referred beyond the Admin's threshold first
 * (GET /admin/reports).
 */
export function DirectoryReportsPanel({ selectedKey, onOpen }: DirectoryReportsPanelProps) {
  const { t } = useTranslation()
  const reports = useDirectoryReports()
  const { line } = useReportText()
  const items = reports.data ?? []
  const profiles = items.filter((item) => item.type === 'profile').length

  return (
    <Panel
      title={t('panels.directoryReports')}
      code="MOD"
      options={
        reports.data && (
          <span>
            {t('directoryReports.profiles', { count: profiles })} ·{' '}
            {t('directoryReports.conversations', { count: items.length - profiles })}
          </span>
        )
      }
    >
      <QueryView
        query={reports}
        isEmpty={(list) => list.length === 0}
        emptyMessage={t('directoryReports.none')}
      >
        {(list) => (
          <ul className="flex flex-col">
            {list.map((item, index) => {
              const selected = reportKey(item) === selectedKey
              return (
                <li
                  key={reportKey(item)}
                  className={clsx(
                    'border-b',
                    selected ? 'bg-selected' : index % 2 === 1 && 'bg-row-alt',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onOpen(item)}
                    aria-current={selected}
                    className="flex w-full flex-col items-start gap-1 px-3 py-2 text-left font-sans text-data"
                  >
                    <ReportTags item={item} />
                    <span className="max-w-full truncate text-label font-semibold">
                      {item.title}
                    </span>
                    <span className="max-w-full truncate text-secondary">{line(item)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </QueryView>
    </Panel>
  )
}
