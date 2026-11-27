import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DEBT_ZONE, useDebtDocuments } from '@/entities/debt'
import type { DocumentDto, SovereignRatingDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { ScrollArea } from '@/shared/ui/ScrollArea'
import { DocumentDialog } from './DocumentDialog'

/**
 * DEBT's ratings and documents (screen 35, sixth version): S&P's, Moody's and Fitch's ratings of
 * the state with their outlooks, "(example)" for the demo's and hidden while ADMCFG's switch is
 * off (ROADMAP decision 60); then the documents the Data admin publishes in NEWS with the state
 * as subject, each opened in the PDF viewer. API /debt/{country}/documents.
 */
export function RatingsDocumentsPanel({ country }: { country: string }) {
  const { t } = useTranslation()
  const format = useFormat()
  const documents = useDebtDocuments(country)
  const [open, setOpen] = useState<DocumentDto | null>(null)

  return (
    <Panel title={t('panels.debtDocuments')} code="DEBT" bodyClassName="flex flex-col">
      <QueryView query={documents}>
        {(data) => (
          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-3 px-3 py-2 font-sans text-data">
              <section aria-label={t('debt.documents.ratings')}>
                {country === DEBT_ZONE ? (
                  <p className="text-secondary">{t('debt.documents.zone')}</p>
                ) : !data.ratingsShown ? (
                  <p className="text-secondary">{t('debt.documents.hidden')}</p>
                ) : (
                  <ul>
                    {data.ratings.map((rating) => (
                      <RatingRow key={rating.agency} rating={rating} />
                    ))}
                  </ul>
                )}
              </section>
              <section aria-labelledby="debt-documents-title">
                <h3
                  id="debt-documents-title"
                  className="mb-1 font-mono text-title font-semibold tracking-title text-accent-amber uppercase"
                >
                  {t('debt.documents.title')}
                </h3>
                {data.documents.length === 0 ? (
                  <p className="text-secondary">{t('debt.documents.none')}</p>
                ) : (
                  <ul className="space-y-1">
                    {data.documents.map((document) => (
                      <li key={document.id} className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label={t('debt.documents.open', { title: document.title })}
                          onClick={() => setOpen(document)}
                          className="inline-flex min-h-6 min-w-9 items-center justify-center border border-info/60 px-1.5 font-mono text-title text-info hover:bg-selected"
                        >
                          {t('debt.documents.pdf')}
                        </button>
                        <span className="min-w-0 flex-1 truncate text-primary">
                          {document.title}
                        </span>
                        <span className="shrink-0 text-secondary">
                          {format.date(document.publishedAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </ScrollArea>
        )}
      </QueryView>
      <p className="shrink-0 border-t px-3 py-1 font-sans text-title text-warning">
        {t('debt.documents.note')}
      </p>
      <DocumentDialog
        documentId={open?.id ?? null}
        title={open?.title ?? ''}
        onClose={() => setOpen(null)}
      />
    </Panel>
  )
}

function RatingRow({ rating }: { rating: SovereignRatingDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const value = rating.rating
  return (
    <li
      className="grid grid-cols-[minmax(0,1fr)_auto_6rem] items-center gap-3 border-b py-1.5 last:border-b-0"
      title={rating.ratedOn ? format.isoDate(rating.ratedOn) : undefined}
    >
      <span className="text-primary">{t(`debt.documents.agencies.${rating.agency}`)}</span>
      <span className="font-mono text-info">
        {value === null
          ? t('debt.documents.notRated')
          : rating.example
            ? t('debt.documents.example', { rating: value })
            : value}
      </span>
      <span className="text-right text-secondary">
        {rating.outlook ? t(`debt.documents.outlooks.${rating.outlook}`) : '—'}
      </span>
    </li>
  )
}
