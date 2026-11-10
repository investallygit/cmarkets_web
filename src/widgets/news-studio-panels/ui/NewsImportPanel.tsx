import { useTranslation } from 'react-i18next'
import { LastNewsImport, NewsImportUpload, NewsTemplateLinks } from '@/features/import-news'
import { Panel } from '@/shared/ui/Panel'

/**
 * Screen 13, right, bottom: the templates, the drop zone (CSV, XLSX or ZIP), the last import and
 * its rows in error with their "Fix row". API /provider/news/template and /provider/news/imports.
 */
export function NewsImportPanel() {
  const { t } = useTranslation()
  return (
    <Panel title={t('panels.fileImport')} code="NEWS IMP" options={<NewsTemplateLinks />}>
      <div className="flex flex-col gap-3 p-3">
        <NewsImportUpload />
        <LastNewsImport />
      </div>
    </Panel>
  )
}
