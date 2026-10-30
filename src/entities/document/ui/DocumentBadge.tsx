import { useTranslation } from 'react-i18next'
import type { DocumentType } from '@/shared/api/contracts'
import { Badge } from '@/shared/ui/Badge'

/** NOTICE for exchange notices, DECISION for regulators, PDF for the issuer's documents. */
export function DocumentBadge({ type }: { type: DocumentType }) {
  const { t } = useTranslation()
  if (type === 'notice') return <Badge tone="info">{t('documents.badges.notice')}</Badge>
  if (type === 'decision') return <Badge tone="warning">{t('documents.badges.decision')}</Badge>
  return <Badge tone="info">{t('documents.badges.pdf')}</Badge>
}
