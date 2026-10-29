import { SearchX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { StatusMessage } from './StatusMessage'

export function NotFoundScreen() {
  const { t } = useTranslation()
  return <StatusMessage icon={SearchX} message={t('status.notFound')} />
}
