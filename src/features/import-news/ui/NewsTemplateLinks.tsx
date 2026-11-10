import { useTranslation } from 'react-i18next'
import { useNewsTemplate } from '@/entities/news'
import { saveBlob } from '@/shared/lib/download'
import { toast } from '@/shared/ui/toast'

const FORMATS = ['csv', 'xlsx'] as const

/** "TEMPLATE CSV · XLSX" in the panel's title bar (GET /provider/news/template). */
export function NewsTemplateLinks() {
  const { t } = useTranslation()
  const template = useNewsTemplate()
  return (
    <span className="panel-no-drag inline-flex items-center gap-1.5">
      {t('newsStudio.import.template')}
      {FORMATS.map((format, index) => (
        <span key={format} className="inline-flex items-center gap-1.5">
          {index > 0 && <span aria-hidden>·</span>}
          <button
            type="button"
            disabled={template.isPending}
            aria-label={t('newsStudio.import.templateLabel', { format: format.toUpperCase() })}
            className="uppercase hover:text-primary disabled:opacity-50"
            onClick={() =>
              template.mutate(format, {
                onSuccess: (blob) => saveBlob(blob, `cmarket_news_template.${format}`),
                onError: (error) => toast.error(error.message),
              })
            }
          >
            {format}
          </button>
        </span>
      ))}
    </span>
  )
}
