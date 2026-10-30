import { Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { StatusMessage } from './StatusMessage'

/** Shown when the account type lacks the screen's permission (spec section 12). */
export function ForbiddenPage() {
  const { t } = useTranslation()
  return <StatusMessage icon={Lock} message={t('status.forbidden')} />
}
