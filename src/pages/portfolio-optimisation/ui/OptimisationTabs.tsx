import { useTranslation } from 'react-i18next'
import { useOptimizer } from '@/entities/optimizer'
import { optimizerPath, optimizerResultPath } from '@/shared/routes/paths'
import { ScreenTabs } from '@/shared/ui/ScreenTabs'

/**
 * The tab bar of screens 28 and 29: OPT Setup, OPT RES Result; with the saved scenario whose result
 * shows, so that each address opens it again (B60).
 */
export function OptimisationTabs() {
  const { t } = useTranslation()
  const saved = useOptimizer((state) => (state.resultSaved ? state.scenario?.id : undefined))
  return (
    <ScreenTabs
      label={t('opt.tabs.label')}
      tabs={[
        { to: optimizerPath({ scenario: saved }), code: 'OPT', label: t('opt.tabs.setup') },
        { to: optimizerResultPath(saved), code: 'OPT RES', label: t('opt.tabs.result') },
      ]}
    />
  )
}
