import { TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { isRouteErrorResponse, useRouteError } from 'react-router'
import { PageLoadError } from '@/shared/lib/lazyPage'
import { StatusMessage } from './StatusMessage'

/** What the error says of itself, for a report; nothing for files that did not come. */
function detailOf(error: unknown): string | undefined {
  if (error instanceof PageLoadError) return undefined
  if (isRouteErrorResponse(error)) return `${error.status} ${error.statusText}`
  return error instanceof Error ? error.message : undefined
}

/** Router error boundary: an unexpected error in a screen, or a screen that did not load. */
export function RouteErrorPage() {
  const { t } = useTranslation()
  const error = useRouteError()
  return (
    <div className="h-full bg-app">
      <StatusMessage
        icon={TriangleAlert}
        message={t(error instanceof PageLoadError ? 'status.notLoaded' : 'status.unexpected')}
        detail={detailOf(error)}
        // React keeps a page that failed to load as failed: only a reload asks for it again.
        onReload={() => window.location.reload()}
      />
    </div>
  )
}
