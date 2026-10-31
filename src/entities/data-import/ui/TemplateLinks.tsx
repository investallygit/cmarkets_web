import { useTranslation } from 'react-i18next'
import { useImportTemplate } from '../api/queries'
import type { ImportType } from '@/shared/api/contracts'
import { saveBlob } from '@/shared/lib/download'

const FORMATS = ['csv', 'xlsx'] as const

/** "CSV · Excel": the template of a file type (GET /data/import-types/{type}/template). */
export function TemplateLinks({ type }: { type: ImportType }) {
  const { t } = useTranslation()
  const template = useImportTemplate()
  const typeName = t(`dataImport.types.${type}`)
  return (
    <span className="inline-flex items-center gap-1.5 font-sans text-data">
      {FORMATS.map((format, index) => (
        <span key={format} className="inline-flex items-center gap-1.5">
          {index > 0 && <span className="text-secondary">·</span>}
          <button
            type="button"
            className="text-info hover:underline disabled:opacity-50"
            disabled={template.isPending}
            aria-label={t('dataImport.templates.downloadType', {
              type: typeName,
              format: t(`dataImport.templates.${format}`),
            })}
            onClick={() =>
              template.mutate(
                { type, format },
                {
                  onSuccess: (blob) =>
                    saveBlob(blob, `cmarket_template_${type.replaceAll('-', '_')}.${format}`),
                },
              )
            }
          >
            {t(`dataImport.templates.${format}`)}
          </button>
        </span>
      ))}
      {template.error && (
        <span role="alert" className="text-down">
          {template.error.message}
        </span>
      )}
    </span>
  )
}
