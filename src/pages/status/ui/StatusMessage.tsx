import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

interface StatusMessageProps {
  icon: LucideIcon
  message: string
  detail?: string
}

export function StatusMessage({ icon: Icon, message, detail }: StatusMessageProps) {
  const { t } = useTranslation()
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center font-sans text-label text-secondary">
      <Icon aria-hidden className="size-6" />
      <p className="text-primary">{message}</p>
      {detail && <p className="max-w-xl font-mono text-data">{detail}</p>}
      <Link to="/" className="text-info hover:underline">
        {t('status.backHome')}
      </Link>
    </div>
  )
}
