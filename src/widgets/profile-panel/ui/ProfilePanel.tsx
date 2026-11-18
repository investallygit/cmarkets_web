import { useTranslation } from 'react-i18next'
import { ProfileForm } from '@/features/edit-profile'
import { Panel } from '@/shared/ui/Panel'

/**
 * CFG, the user's profile: name, phone, language and time zone (GET / PUT /me); an employee's on
 * ME.
 */
export function ProfilePanel({ code = 'CFG' }: { code?: string }) {
  const { t } = useTranslation()
  return (
    <Panel title={t('panels.profile')} code={code}>
      <ProfileForm />
    </Panel>
  )
}
