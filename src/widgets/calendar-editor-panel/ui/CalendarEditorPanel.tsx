import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  EventTypeBadge,
  useCalendarEntries,
  useDeleteCalendarEntry,
} from '@/entities/calendar-event'
import { CalendarEntryDialog } from '@/features/edit-calendar-event'
import type { CalendarEntryDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { addDays } from '@/shared/lib/isoDate'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Button } from '@/shared/ui/form/Button'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { toast } from '@/shared/ui/toast'

/** The days CORR lists: the past week, then two months ahead. */
const PAST_DAYS = 7
const COMING_DAYS = 62

/**
 * CORR's calendar (CAL, screen 32, sixth version; ROADMAP decision 57): the events entered or
 * loaded around today (meetings, releases, statistics, international ones), each corrected,
 * confirmed or deleted, a new one entered ("announced date" until confirmed); each save in AUDT.
 */
export function CalendarEditorPanel({ today }: { today: string }) {
  const { t } = useTranslation()
  const format = useFormat()
  const entries = useCalendarEntries(addDays(today, -PAST_DAYS), addDays(today, COMING_DAYS))
  const remove = useDeleteCalendarEntry()
  const [editing, setEditing] = useState<CalendarEntryDto | 'new' | null>(null)
  const [deleting, setDeleting] = useState<CalendarEntryDto | null>(null)

  return (
    <Panel
      title={t('calendar.corr.title')}
      code="CORR"
      options={
        <Button size="sm" icon={Plus} onClick={() => setEditing('new')}>
          {t('calendar.corr.add')}
        </Button>
      }
    >
      <QueryView
        query={entries}
        isEmpty={(rows) => rows.length === 0}
        emptyMessage={t('calendar.corr.empty')}
      >
        {(rows) => (
          <ul className="divide-y">
            {rows.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center gap-2 px-2 py-1.5 font-sans text-data"
              >
                <span className="w-24 shrink-0 font-mono text-secondary">
                  {format.isoDate(entry.date)}
                  {entry.time ? ` ${entry.time}` : ''}
                </span>
                <EventTypeBadge type={entry.type} />
                <span className="min-w-0 flex-1 truncate">
                  {entry.title}
                  <span className="text-secondary">
                    {' · '}
                    {entry.confirmed
                      ? t('calendar.corr.isConfirmed')
                      : t('calendar.corr.isAnnounced')}
                    {' · '}
                    {t(`calendar.detail.sources.${entry.source}`)}
                  </span>
                </span>
                <button
                  type="button"
                  aria-label={t('calendar.corr.edit', { title: entry.title })}
                  onClick={() => setEditing(entry)}
                  className="inline-flex size-6 items-center justify-center text-secondary hover:text-primary"
                >
                  <Pencil size={14} aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label={t('calendar.corr.delete', { title: entry.title })}
                  onClick={() => setDeleting(entry)}
                  className="inline-flex size-6 items-center justify-center text-secondary hover:text-down"
                >
                  <Trash2 size={14} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </QueryView>
      <CalendarEntryDialog
        open={editing !== null}
        entry={editing === 'new' ? null : editing}
        today={today}
        onClose={() => setEditing(null)}
      />
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={t('calendar.corr.confirmTitle', { title: deleting?.title ?? '' })}
        message={t('calendar.corr.confirmMessage')}
        confirmLabel={t('calendar.corr.delete', { title: deleting?.title ?? '' })}
        tone="danger"
        busy={remove.isPending}
        onConfirm={() => {
          if (!deleting) return
          const title = deleting.title
          remove.mutate(deleting.id, {
            onSuccess: () => {
              toast.success(t('calendar.corr.deleted', { title }))
              setDeleting(null)
            },
          })
        }}
      />
    </Panel>
  )
}
