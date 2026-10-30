import { LoaderCircle, RefreshCw, TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type FullScreenStatusProps =
  { kind: 'loading' } | { kind: 'error'; message: string; onRetry: () => void }

/** While the session or /me loads, before any screen: a spinner, or the error and Retry. */
export function FullScreenStatus(props: FullScreenStatusProps) {
  const { t } = useTranslation()
  return (
    <div className="flex h-full items-center justify-center gap-2 font-sans text-label text-secondary">
      {props.kind === 'loading' ? (
        <>
          <LoaderCircle aria-hidden className="size-4 animate-spin" />
          {t('app.connecting')}
        </>
      ) : (
        <>
          <TriangleAlert aria-hidden className="size-4 text-down" />
          {props.message}
          <button
            type="button"
            onClick={props.onRetry}
            className="inline-flex items-center gap-1 border px-2 py-0.5 hover:text-primary"
          >
            <RefreshCw aria-hidden className="size-3" />
            {t('app.retry')}
          </button>
        </>
      )}
    </div>
  )
}
