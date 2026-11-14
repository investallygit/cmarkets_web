import { useTranslation } from 'react-i18next'
import { RfqAuditExport } from '@/features/export-rfq-audit'
import { Panel } from '@/shared/ui/Panel'

/**
 * AUDT, beside the platform's log: the RFQ's compliance export (ROADMAP step 44), every event of
 * its trading over a period, to the millisecond, for the holder of rfq:report.
 */
export function RfqAuditExportPanel() {
  const { t } = useTranslation()
  return (
    <Panel title={t('panels.rfqAudit')} code="AUDT">
      <RfqAuditExport />
    </Panel>
  )
}
