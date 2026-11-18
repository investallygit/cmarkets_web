import { LoaderCircle, RefreshCw, TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function PanelLoading() {
  const { t } = useTranslation()
  return (
    <div className="flex h-full min-h-10 items-center justify-center gap-2 font-sans text-data text-secondary">
      <LoaderCircle aria-hidden className="size-3.5 animate-spin" />
      {t('common.loading')}
    </div>
  )
}

interface PanelErrorProps {
  error: unknown
  onRetry?: () => void
}

export function PanelError({ error, onRetry }: PanelErrorProps) {
  const { t } = useTranslation()
  const message = error instanceof Error ? error.message : String(error)
  return (
    <div className="flex h-full min-h-10 flex-col items-center justify-center gap-2 p-2 text-center font-sans text-data">
      <span className="inline-flex items-center gap-1.5 text-down">
        <TriangleAlert aria-hidden className="size-3.5 shrink-0" />
        {message}
      </span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="panel-no-drag inline-flex items-center gap-1 border px-2 py-0.5 text-secondary hover:text-primary"
        >
          <RefreshCw aria-hidden className="size-3" />
          {t('common.retry')}
        </button>
      )}
    </div>
  )
}

export function PanelEmpty({ message }: { message?: string }) {
  const { t } = useTranslation()
  return (
    <div className="flex h-full min-h-10 items-center justify-center p-2 font-sans text-data text-secondary">
      {message ?? t('common.noData')}
    </div>
  )
}

/**
 * A part of a panel that could not be read, in a line of its own place: the user's saved screens,
 * scenarios… said, with Retry, rather than an empty list (B63).
 */
export function InlineError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useTranslation()
  return (
    <span role="alert" className="inline-flex flex-wrap items-center gap-x-2 font-sans text-down">
      {message}
      {onRetry && (
        <button type="button" onClick={onRetry} className="min-h-6 text-info hover:underline">
          {t('common.retry')}
        </button>
      )}
    </span>
  )
}
