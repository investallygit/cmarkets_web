import { useTranslation } from 'react-i18next'
import { useMacroSettings } from '@/entities/platform-settings'
import { MacroSettingsForm } from '@/features/edit-platform-settings'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

/** ADMCFG, the macroeconomic and exchange-rate screens: FX's currencies against the XAF and its matrix's. */
export function MacroSettingsPanel() {
  const { t } = useTranslation()
  const settings = useMacroSettings()
  return (
    <Panel title={t('panels.macroSettings')} code="CFG">
      <QueryView query={settings}>
        {(data) => <MacroSettingsForm key={data.updatedAt ?? ''} settings={data} />}
      </QueryView>
    </Panel>
  )
}
