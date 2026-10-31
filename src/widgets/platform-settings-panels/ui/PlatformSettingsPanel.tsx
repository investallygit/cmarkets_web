import { useTranslation } from 'react-i18next'
import { usePlatformSettings } from '@/entities/platform-settings'
import { PlatformSettingsForm } from '@/features/edit-platform-settings'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

/** ADMCFG, settings: quotas by account type, research pricing and moderation, risk-free rate. */
export function PlatformSettingsPanel() {
  const { t } = useTranslation()
  const settings = usePlatformSettings()
  return (
    <Panel title={t('panels.platformSettings')} code="CFG">
      <QueryView query={settings}>
        {(data) => <PlatformSettingsForm key={data.updatedAt ?? ''} settings={data} />}
      </QueryView>
    </Panel>
  )
}
