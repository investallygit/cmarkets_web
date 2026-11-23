import { clsx } from 'clsx'
import { Download, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  downloadExportFile,
  useDeleteExport,
  useDeleteExportSchedule,
  useExportSchedules,
  useExports,
} from '@/entities/data-export'
import type { ExportDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { toast } from '@/shared/ui/toast'

/**
 * DL's "My downloads" (spec section 9, screen 30): the files of the last 7 days, newest first,
 * each ready (its file), in progress (its share) or expired; a file is deleted from here. ExportReady
 * reads the list again when a job is done.
 */
export function MyDownloadsPanel() {
  const { t } = useTranslation()
  const exports = useExports()
  return (
    <Panel
      title={t('panels.myDownloads')}
      code="DL"
      options={<span>{t('downloads.mine.kept')}</span>}
      bodyClassName="flex flex-col"
    >
      <QueryView
        query={exports}
        isEmpty={(items) => items.length === 0}
        emptyMessage={t('downloads.mine.none')}
      >
        {(items) => (
          <ul className="min-h-0 flex-1">
            {items.map((item) => (
              <DownloadRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </QueryView>
      <Schedules />
      <p className="shrink-0 px-3 py-2 font-sans text-caption text-secondary">
        {t('downloads.mine.note')}
      </p>
    </Panel>
  )
}

function DownloadRow({ item }: { item: ExportDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const remove = useDeleteExport()
  const name = t(`downloads.datasets.${item.dataset}.name`)
  const label = `${name} · ${item.summary}`
  return (
    <li className="grid grid-cols-[1fr_auto] gap-x-2 border-b px-3 py-2">
      <span className="font-sans text-label font-semibold">{name}</span>
      <Status item={item} label={label} />
      <span className="truncate font-sans text-caption text-secondary" title={item.summary}>
        {item.summary} · {item.format.toUpperCase()}
      </span>
      {item.status !== 'inProgress' && item.status !== 'expired' ? (
        <button
          type="button"
          aria-label={t('downloads.mine.delete', { name: label })}
          disabled={remove.isPending}
          onClick={() =>
            remove.mutate(item.id, {
              onSuccess: () => toast.success(t('downloads.mine.deleted', { name })),
              onError: (error) => toast.error(error.message),
            })
          }
          className="inline-flex size-6 items-center justify-center justify-self-end text-secondary hover:text-down"
        >
          <Trash2 aria-hidden className="size-3.5" />
        </button>
      ) : (
        <span />
      )}
      <span className="font-mono text-caption text-secondary">
        {format.dayMonth(item.createdAt)} {format.time(item.createdAt)}
      </span>
    </li>
  )
}

function Status({ item, label }: { item: ExportDto; label: string }) {
  const { t } = useTranslation()
  if (item.status === 'ready')
    return (
      <span className="flex flex-col items-end font-sans text-data">
        <span className="text-up">{t('downloads.mine.ready')}</span>
        <button
          type="button"
          aria-label={t('downloads.mine.fileOf', { name: label })}
          onClick={() =>
            void downloadExportFile(item).catch((error: Error) => toast.error(error.message))
          }
          className="inline-flex min-h-6 items-center gap-1 text-info hover:underline"
        >
          <Download aria-hidden className="size-3" />
          {t('downloads.mine.file')}
        </button>
      </span>
    )
  return (
    <span
      className={clsx(
        'text-right font-sans text-data',
        item.status === 'inProgress' && 'text-accent-amber',
        item.status === 'failed' && 'text-down',
        item.status === 'expired' && 'text-secondary',
      )}
    >
      {item.status === 'inProgress'
        ? t('downloads.mine.inProgress', { progress: item.progress })
        : t(`downloads.mine.${item.status}`)}
    </span>
  )
}

/** The user's scheduled exports, under the files: how often, the next run, a stop. */
function Schedules() {
  const { t } = useTranslation()
  const format = useFormat()
  const schedules = useExportSchedules().data ?? []
  const remove = useDeleteExportSchedule()
  if (schedules.length === 0) return null
  return (
    <section aria-label={t('downloads.schedule.list')} className="shrink-0 border-t">
      <h3 className="px-3 pt-2 font-sans text-caption tracking-title text-secondary uppercase">
        {t('downloads.schedule.list')}
      </h3>
      <ul>
        {schedules.map((schedule) => {
          const name = `${t(`downloads.datasets.${schedule.dataset}.name`)} · ${schedule.summary}`
          return (
            <li
              key={schedule.id}
              className="flex items-center gap-2 px-3 py-1.5 font-sans text-data"
            >
              <span className="min-w-0 flex-1 truncate" title={name}>
                {t(`downloads.datasets.${schedule.dataset}.name`)}
              </span>
              <span className="text-secondary">
                {t(`downloads.schedule.every.${schedule.frequency}`)} ·{' '}
                {t('downloads.schedule.next', { date: format.dayMonth(schedule.nextRunAt) })}
              </span>
              <button
                type="button"
                aria-label={t('downloads.schedule.delete', { name })}
                disabled={remove.isPending}
                onClick={() =>
                  remove.mutate(schedule.id, {
                    onSuccess: () => toast.success(t('downloads.schedule.deleted')),
                    onError: (error) => toast.error(error.message),
                  })
                }
                className="inline-flex size-6 items-center justify-center text-secondary hover:text-down"
              >
                <Trash2 aria-hidden className="size-3.5" />
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
