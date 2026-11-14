import { useTranslation } from 'react-i18next'
import { useRfqSettings } from '@/entities/platform-settings'
import { RfqSettingsForm } from '@/features/edit-platform-settings'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

/** ADMCFG, the RFQ (ROADMAP step 43): its switch, its amounts, the licensed SVTs. */
export function RfqSettingsPanel() {
  const { t } = useTranslation()
  const settings = useRfqSettings()
  return (
    <Panel title={t('panels.rfqSettings')} code="CFG">
      <QueryView query={settings}>
        {(data) => <RfqSettingsForm key={data.updatedAt ?? ''} settings={data} />}
      </QueryView>
    </Panel>
  )
}
