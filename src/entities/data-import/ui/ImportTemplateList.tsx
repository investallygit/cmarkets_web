import { useTranslation } from 'react-i18next'
import type { ImportTypeDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { QueryView } from '@/shared/ui/QueryView'
import { useImportTypes } from '../api/queries'
import { IMPORT_TYPES } from '../config/importTypes'
import { TemplateLinks } from './TemplateLinks'

/**
 * The file templates of spec section 11: how often each file comes, its columns (in this order,
 * optional ones marked), the checks it goes through and its downloads.
 */
export function ImportTemplateList() {
  const { t } = useTranslation()
  const format = useFormat()
  const types = useImportTypes()
  const threshold = (definition: ImportTypeDto) =>
    definition.changeThreshold &&
    t('dataImport.templates.threshold', {
      value:
        definition.changeThreshold.unit === 'pct'
          ? format.percent(definition.changeThreshold.value, 0, false)
          : t('dataImport.points', { value: format.number(definition.changeThreshold.value, 2) }),
    })
  return (
    <QueryView query={types}>
      {(definitions) => (
        <ul className="divide-y">
          {IMPORT_TYPES.flatMap((type) => definitions.find((item) => item.type === type) ?? []).map(
            (definition) => (
              <li key={definition.type} className="grid gap-1 px-2 py-2">
                <div className="flex items-baseline gap-3">
                  <h3 className="font-sans text-label text-primary">
                    {t(`dataImport.types.${definition.type}`)}
                  </h3>
                  <span className="font-sans text-data text-secondary">
                    {t(`dataImport.frequencies.${definition.frequency}`)}
                  </span>
                  <span className="ml-auto">
                    <TemplateLinks type={definition.type} />
                  </span>
                </div>
                <p className="font-mono text-data break-words text-secondary">
                  {definition.columns
                    .map((column) =>
                      column.required
                        ? column.name
                        : `${column.name} (${t('dataImport.templates.optional')})`,
                    )
                    .join(' ; ')}
                </p>
                <p className="font-sans text-data text-secondary">
                  {[
                    ...definition.checks.map((check) => t(`dataImport.checkNames.${check}`)),
                    threshold(definition),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </li>
            ),
          )}
        </ul>
      )}
    </QueryView>
  )
}
