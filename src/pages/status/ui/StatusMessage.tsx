import { RefreshCw, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { routes } from '@/shared/routes/paths'

interface StatusMessageProps {
  icon: LucideIcon
  message: string
  detail?: string
  onReload?: () => void
}

export function StatusMessage({ icon: Icon, message, detail, onReload }: StatusMessageProps) {
  const { t } = useTranslation()
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center font-sans text-label text-secondary">
      <Icon aria-hidden className="size-6" />
      <p className="text-primary">{message}</p>
      {detail && <p className="max-w-xl font-mono text-data">{detail}</p>}
      {onReload && (
        <button
          type="button"
          onClick={onReload}
          className="inline-flex min-h-6 items-center gap-1.5 border px-2 py-0.5 text-secondary hover:text-primary"
        >
          <RefreshCw aria-hidden className="size-3.5" />
          {t('status.reload')}
        </button>
      )}
      <Link to={routes.app} className="text-info hover:underline">
        {t('status.backHome')}
      </Link>
    </div>
  )
}
