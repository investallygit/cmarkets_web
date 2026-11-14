import { useTranslation } from 'react-i18next'
import { routes } from '@/shared/routes/paths'
import { ScreenTabs } from '@/shared/ui/ScreenTabs'

/** The tab bar of screens 28 and 29: OPT Setup, OPT RES Result. */
export function OptimisationTabs() {
  const { t } = useTranslation()
  return (
    <ScreenTabs
      label={t('opt.tabs.label')}
      tabs={[
        { to: routes.optimizer, code: 'OPT', label: t('opt.tabs.setup') },
        { to: routes.optimizerResult, code: 'OPT RES', label: t('opt.tabs.result') },
      ]}
    />
  )
}
