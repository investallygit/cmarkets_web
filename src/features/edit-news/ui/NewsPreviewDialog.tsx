import { useTranslation } from 'react-i18next'
import { NewsBody, NewsSourceTag, NewsTypeTag, useProviderSource } from '@/entities/news'
import { QuoteCard } from '@/entities/quote'
import { Dialog, DialogBody } from '@/shared/ui/Dialog'
import { useNewsDraftStore } from '../model/newsDraftStore'

/**
 * Preview: the item as readers will see it on N, from the working copy: its two tags, headline,
 * standfirst or FLASH text, body with its images and cards, and its byline.
 */
export function NewsPreviewDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const draft = useNewsDraftStore((state) => state.draft)
  const source = useProviderSource().data
  if (!draft) return null
  const { form } = draft
  return (
    <Dialog open={open} onClose={onClose} title={t('newsStudio.preview.title')} width={720}>
      <DialogBody>
        <article lang={form.language} className="flex flex-col gap-3">
          <p className="flex flex-wrap items-center gap-2 font-mono text-data">
            <NewsTypeTag type={form.type} mode="none" />
            {source && <NewsSourceTag source={source} mode="none" />}
            {draft.item.subject && (
              <span className="font-semibold text-accent-amber">{draft.item.subject}</span>
            )}
          </p>
          <h3 className="font-sans text-figure font-semibold">{form.headline}</h3>
          <p
            className={
              form.type === 'flash' ? 'font-sans text-label' : 'font-sans text-label font-semibold'
            }
          >
            {form.summary}
          </p>
          {form.type === 'article' && form.body && (
            <NewsBody
              body={form.body}
              renderSecurity={(securityId, code) => (
                <QuoteCard securityId={securityId} code={code} linked={false} />
              )}
            />
          )}
          {source && (
            <footer className="border-t pt-2 font-sans text-data text-secondary">
              {form.author.trim()
                ? t('newsStudio.preview.byline', { name: source.name, author: form.author.trim() })
                : source.name}
            </footer>
          )}
        </article>
      </DialogBody>
    </Dialog>
  )
}
