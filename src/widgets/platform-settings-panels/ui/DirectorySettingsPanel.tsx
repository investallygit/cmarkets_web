import { useTranslation } from 'react-i18next'
import { useDirectorySettings } from '@/entities/platform-settings'
import { DirectorySettingsForm } from '@/features/edit-platform-settings'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

/** ADMCFG, the directory and the messaging: default contact rules, daily limits, report threshold. */
export function DirectorySettingsPanel() {
  const { t } = useTranslation()
  const settings = useDirectorySettings()
  return (
    <Panel title={t('panels.directorySettings')} code="CFG">
      <QueryView query={settings}>
        {(data) => <DirectorySettingsForm key={data.updatedAt ?? ''} settings={data} />}
      </QueryView>
    </Panel>
  )
}
