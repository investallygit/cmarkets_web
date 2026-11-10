import { clsx } from 'clsx'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useLastNewsImport,
  useNewsImport,
  useNewsImportRows,
  usePublishNewsImport,
} from '@/entities/news'
import type { NewsImportDto, NewsImportRowDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Button } from '@/shared/ui/form/Button'
import { toast } from '@/shared/ui/toast'
import { issueText } from '../lib/issueText'
import { FixNewsRowDialog } from './FixNewsRowDialog'
import { NewsImportRowsDialog } from './NewsImportRowsDialog'

/** The rows in error listed under the summary; View details shows them all. */
const ERRORS_SHOWN = 3

/**
 * LAST IMPORT: the file and its time, the rows read, published or scheduled, the updates of a known
 * external_id, the errors with their "Fix row", and Publish while valid rows wait (spec section
 * 16, "Import cycle"). Followed every second while its job checks it.
 */
export function LastNewsImport() {
  const { t } = useTranslation()
  const last = useLastNewsImport()
  const live = useNewsImport(last.data?.id ?? null)
  const upload = live.data ?? last.data ?? null
  if (!upload) {
    return last.isPending ? null : (
      <p className="font-sans text-data text-secondary">{t('newsStudio.import.none')}</p>
    )
  }
  return <Summary key={upload.id} upload={upload} />
}

function Summary({ upload }: { upload: NewsImportDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const errors = useNewsImportRows(upload.counts.errors > 0 ? upload.id : null, 'error')
  const publish = usePublishNewsImport()
  const [fixing, setFixing] = useState<NewsImportRowDto | null>(null)
  const [details, setDetails] = useState(false)
  const { counts } = upload

  /** Each count, red for errors and green for what reached the feed once there are any. */
  const lines: { label: string; value: number; tone?: 'up' | 'down' }[] = [
    { label: t('newsStudio.import.read'), value: counts.read },
    ...(counts.valid > 0 ? [{ label: t('newsStudio.import.valid'), value: counts.valid }] : []),
    { label: t('newsStudio.import.published'), value: counts.published, tone: 'up' as const },
    { label: t('newsStudio.import.updated'), value: counts.updated },
    { label: t('newsStudio.import.errors'), value: counts.errors, tone: 'down' as const },
  ]

  return (
    <section aria-labelledby={`import-${upload.id}`} className="flex flex-col gap-1.5">
      <h3
        id={`import-${upload.id}`}
        className="font-sans text-title font-semibold tracking-title text-accent-amber uppercase"
      >
        {t('newsStudio.import.last')}
      </h3>
      <p className="font-mono text-data break-all text-info">
        {upload.fileName} · {format.time(upload.uploadedAt)}
      </p>
      {upload.status === 'checking' ? (
        <p role="status" className="font-sans text-data text-secondary">
          {t('newsStudio.import.checking', { file: upload.fileName })}
        </p>
      ) : upload.status === 'failed' ? (
        <p role="alert" className="font-sans text-data text-down">
          {t('newsStudio.import.failed', { file: upload.fileName, error: upload.error ?? '' })}
        </p>
      ) : (
        <>
          <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 font-sans text-data">
            {lines.map(({ label, value, tone }) => (
              <div key={label} className="contents">
                <dt className="text-secondary">{label}</dt>
                <dd
                  className={clsx(
                    'text-right font-mono',
                    value > 0 && tone === 'up' && 'text-up',
                    value > 0 && tone === 'down' && 'text-down',
                  )}
                >
                  {format.number(value, 0)}
                </dd>
              </div>
            ))}
          </dl>
          {errors.data?.items.slice(0, ERRORS_SHOWN).map((row) => (
            <div key={row.id} className="flex flex-col gap-0.5 font-sans text-data">
              <p className="text-down">
                {t('newsStudio.import.rowError', {
                  line: row.line,
                  message: row.issues[0] ? issueText(t, row.issues[0]) : '',
                })}
              </p>
              <p className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFixing(row)}
                  aria-label={t('newsStudio.import.fix', { line: row.line })}
                  className="h-6 text-info hover:underline"
                >
                  {t('newsStudio.import.fixShort')}
                </button>
                <span aria-hidden>·</span>
                <button
                  type="button"
                  onClick={() => setDetails(true)}
                  className="h-6 text-info hover:underline"
                >
                  {t('newsStudio.import.details')}
                </button>
              </p>
            </div>
          ))}
          {counts.errors === 0 && counts.read > 0 && (
            <button
              type="button"
              onClick={() => setDetails(true)}
              className="h-6 self-start font-sans text-data text-info hover:underline"
            >
              {t('newsStudio.import.details')}
            </button>
          )}
          {counts.valid > 0 && (
            <Button
              variant="primary"
              className="self-start"
              busy={publish.isPending}
              onClick={() =>
                publish.mutate(upload.id, {
                  onSuccess: () => toast.success(t('newsStudio.import.publishedRows')),
                  onError: (error) => toast.error(error.message),
                })
              }
            >
              {t('newsStudio.import.publish', { count: counts.valid })}
            </Button>
          )}
        </>
      )}
      <FixNewsRowDialog importId={upload.id} row={fixing} onClose={() => setFixing(null)} />
      <NewsImportRowsDialog
        upload={details ? upload : null}
        onClose={() => setDetails(false)}
        onFix={(row) => {
          setDetails(false)
          setFixing(row)
        }}
      />
    </section>
  )
}
