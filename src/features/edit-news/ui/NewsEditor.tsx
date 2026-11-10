import { clsx } from 'clsx'
import { FileText, X } from 'lucide-react'
import { lazy, Suspense, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { NEWS_LIMITS, summaryLimit, useRemoveNewsFile, useUploadNewsFile } from '@/entities/news'
import { resolveApiUrl } from '@/shared/config/env'
import { useFormat } from '@/shared/i18n'
import { docLength } from '@/shared/lib/richText'
import { Checkbox } from '@/shared/ui/form/Checkbox'
import { Field } from '@/shared/ui/form/Field'
import { Textarea } from '@/shared/ui/form/Textarea'
import { TextInput } from '@/shared/ui/form/TextInput'
import { PanelLoading } from '@/shared/ui/StatusViews'
import { toast } from '@/shared/ui/toast'
import { limitIssues, publishNeeds, type NewsField, type PublishNeed } from '../model/newsForm'
import { isNewsEditable, useNewsDraftStore } from '../model/newsDraftStore'

// TipTap and ProseMirror load with the editor, after the rest of the studio.
const NewsRichTextEditor = lazy(() =>
  import('./NewsRichTextEditor').then((module) => ({ default: module.NewsRichTextEditor })),
)

/** "58/150": the characters typed against the limit, red past it. */
function Counter({ count, max }: { count: number; max: number }) {
  const { t } = useTranslation()
  return (
    <span className={clsx('font-mono text-data', count > max ? 'text-down' : 'text-secondary')}>
      {t('newsStudio.editor.counter', { count, max })}
    </span>
  )
}

/**
 * Screen 13, centre: the headline with its counter, an ARTICLE's standfirst and body (rich text,
 * images, CMarket security cards) and its PDF, or a FLASH's 500 characters; the source and author,
 * the original link, the rights statement. A withdrawn item only shows.
 */
export function NewsEditor() {
  const { t } = useTranslation()
  const format = useFormat()
  const draft = useNewsDraftStore((state) => state.draft)
  const edit = useNewsDraftStore((state) => state.edit)
  const setRights = useNewsDraftStore((state) => state.setRights)
  if (!draft) return <PanelLoading />

  const { form, item } = draft
  const editable = isNewsEditable(draft)
  const flash = form.type === 'flash'
  const limits = limitIssues(form)
  const needs: readonly PublishNeed[] = draft.checked
    ? publishNeeds(form, {
        rightsConfirmed: draft.rightsConfirmed,
        schedule: null,
        now: new Date(),
      })
    : []
  const message = (field: NewsField | 'rights', max?: number) => {
    const limit = field !== 'rights' ? limits[field] : undefined
    if (limit === 'tooLong') return t('newsStudio.editor.errors.tooLong', { max })
    if (limit === 'url') return t('newsStudio.editor.errors.url')
    if ((needs as readonly string[]).includes(field)) return t('newsStudio.editor.errors.required')
    return draft.serverErrors[field]?.[0] ?? null
  }
  const summaryMax = summaryLimit(form.type)

  return (
    <div className="flex min-h-full flex-col gap-2.5 p-3">
      {item.status === 'withdrawn' && (
        <p
          role="status"
          className="border border-down/60 px-2 py-1.5 font-sans text-data text-down"
        >
          {t('newsStudio.editor.withdrawn', {
            date: item.withdrawnAt
              ? `${format.date(item.withdrawnAt)} ${format.time(item.withdrawnAt)}`
              : '',
            reason: item.withdrawalReason ?? '',
          })}
        </p>
      )}
      <Field
        label={t('newsStudio.editor.headline', { max: NEWS_LIMITS.headline })}
        error={message('headline', NEWS_LIMITS.headline)}
      >
        <TextInput
          value={form.headline}
          onChange={(headline) => edit({ headline })}
          disabled={!editable}
          highlight={!form.headline}
          className="font-semibold"
          trailing={
            editable ? (
              <Counter count={form.headline.trim().length} max={NEWS_LIMITS.headline} />
            ) : undefined
          }
        />
      </Field>
      <Field
        label={t(flash ? 'newsStudio.editor.flashText' : 'newsStudio.editor.standfirst', {
          max: summaryMax,
        })}
        hint={flash ? t('newsStudio.editor.flashHint') : undefined}
        error={message('summary', summaryMax)}
      >
        <Textarea
          value={form.summary}
          onChange={(summary) => edit({ summary })}
          rows={flash ? 6 : 3}
          disabled={!editable}
          highlight={!form.summary}
        />
      </Field>
      {editable && (
        <p className="-mt-1.5 self-end">
          <Counter count={form.summary.trim().length} max={summaryMax} />
        </p>
      )}
      {!flash && (
        <>
          <Suspense fallback={<PanelLoading />}>
            <NewsRichTextEditor
              key={`${draft.newsId}-${draft.generation}`}
              newsId={draft.newsId}
              content={form.body}
              editable={editable}
            />
          </Suspense>
          <p
            role={message('body', NEWS_LIMITS.body) ? 'alert' : undefined}
            className={clsx(
              'font-sans text-data',
              message('body', NEWS_LIMITS.body) ? 'text-down' : 'text-secondary',
            )}
          >
            {message('body', NEWS_LIMITS.body) ??
              t('newsStudio.editor.bodyCount', {
                count: format.number(form.body ? docLength(form.body) : 0, 0),
                max: format.number(NEWS_LIMITS.body, 0),
              })}
          </p>
          <Attachment newsId={draft.newsId} editable={editable} />
        </>
      )}
      <div className="grid gap-2.5 sm:grid-cols-2">
        <Field label={t('newsStudio.editor.author')} error={message('author', NEWS_LIMITS.author)}>
          <TextInput
            value={form.author}
            onChange={(author) => edit({ author })}
            placeholder={t('newsStudio.editor.authorPlaceholder')}
            disabled={!editable}
          />
        </Field>
        <Field label={t('newsStudio.editor.originalUrl')} error={message('originalUrl')}>
          <TextInput
            value={form.originalUrl}
            onChange={(originalUrl) => edit({ originalUrl })}
            type="url"
            placeholder="https://"
            disabled={!editable}
            mono
          />
        </Field>
      </div>
      {editable && item.status !== 'published' && (
        <div className="flex flex-col gap-1">
          <Checkbox
            checked={draft.rightsConfirmed}
            onChange={setRights}
            label={t('newsStudio.editor.rights')}
            highlight={draft.checked && !draft.rightsConfirmed}
          />
          {message('rights') && (
            <p role="alert" className="font-sans text-title text-down">
              {message('rights')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/** "Attachment: communique.pdf (240 KB)": an ARTICLE's PDF, shown under its body. */
function Attachment({ newsId, editable }: { newsId: string; editable: boolean }) {
  const { t } = useTranslation()
  const format = useFormat()
  const attachment = useNewsDraftStore((state) => state.draft?.item.attachment ?? null)
  const upload = useUploadNewsFile(newsId)
  const remove = useRemoveNewsFile(newsId)
  const input = useRef<HTMLInputElement>(null)

  const pick = (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error(t('form.fileTypeRejected', { name: file.name, types: 'PDF' }))
      return
    }
    if (file.size > NEWS_LIMITS.pdfBytes) {
      toast.error(
        t('form.fileTooLarge', { name: file.name, size: format.fileSize(NEWS_LIMITS.pdfBytes) }),
      )
      return
    }
    upload.mutate({ file, credit: null }, { onError: (error) => toast.error(error.message) })
  }

  return (
    <div className="flex flex-wrap items-center gap-2 font-sans text-data">
      {attachment ? (
        <>
          <a
            href={resolveApiUrl(attachment.url)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-info underline underline-offset-2"
          >
            <FileText aria-hidden className="size-3.5" />
            {t('newsStudio.editor.attachment', {
              name: attachment.fileName,
              size: format.fileSize(attachment.size),
            })}
          </a>
          {editable && (
            <button
              type="button"
              aria-label={t('newsStudio.editor.removePdf', { name: attachment.fileName })}
              disabled={remove.isPending}
              onClick={() =>
                remove.mutate(attachment.id, { onError: (error) => toast.error(error.message) })
              }
              className="inline-flex size-6 items-center justify-center text-secondary hover:text-primary"
            >
              <X aria-hidden className="size-3.5" />
            </button>
          )}
        </>
      ) : (
        editable && (
          <button
            type="button"
            title={t('newsStudio.editor.addPdfHint')}
            disabled={upload.isPending}
            onClick={() => input.current?.click()}
            className="inline-flex h-6 items-center gap-1.5 text-info hover:underline disabled:opacity-50"
          >
            <FileText aria-hidden className="size-3.5" />
            {t('newsStudio.editor.addPdf')}
          </button>
        )
      )}
      {editable && (
        <input
          ref={input}
          type="file"
          accept=".pdf,application/pdf"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file) pick(file)
          }}
        />
      )}
    </div>
  )
}
