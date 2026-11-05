import { Check, CheckCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/** ✓ sent, ✓✓ read by every other member (spec section 9, screen 11). */
export function ReadReceipt({ read }: { read: boolean }) {
  const { t } = useTranslation()
  const Icon = read ? CheckCheck : Check
  return (
    <Icon
      role="img"
      aria-label={read ? t('messaging.thread.read') : t('messaging.thread.sent')}
      className={read ? 'size-3.5 text-info' : 'size-3.5 text-secondary'}
    />
  )
}
