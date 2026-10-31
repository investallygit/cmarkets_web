import { useTranslation } from 'react-i18next'
import { ImportTemplateList } from '@/entities/data-import'
import { Panel } from '@/shared/ui/Panel'

/** DATA, the file templates (GET /data/import-types): columns, checks and downloads of each file. */
export function ImportTemplatesPanel() {
  const { t } = useTranslation()
  return (
    <Panel title={t('panels.importTemplates')} code="DATA">
      <p className="px-2 pt-2 font-sans text-data text-secondary">
        {t('dataImport.templates.intro')}
      </p>
      <ImportTemplateList />
    </Panel>
  )
}
