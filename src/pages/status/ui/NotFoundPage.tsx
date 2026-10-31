import { SearchX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle'
import { StatusMessage } from './StatusMessage'

export function NotFoundPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('status.notFoundTitle'))
  return <StatusMessage icon={SearchX} message={t('status.notFound')} />
}
