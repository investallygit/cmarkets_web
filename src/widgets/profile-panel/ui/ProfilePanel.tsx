import { useTranslation } from 'react-i18next'
import { ProfileForm } from '@/features/edit-profile'
import { Panel } from '@/shared/ui/Panel'

/** CFG, the user's profile: name, phone, language and time zone (GET / PUT /me). */
export function ProfilePanel() {
  const { t } = useTranslation()
  return (
    <Panel title={t('panels.profile')} code="CFG">
      <ProfileForm />
    </Panel>
  )
}
