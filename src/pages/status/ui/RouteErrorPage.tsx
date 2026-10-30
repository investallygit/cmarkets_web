import { TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { isRouteErrorResponse, useRouteError } from 'react-router'
import { StatusMessage } from './StatusMessage'

/** Router error boundary: an unexpected error in a screen. */
export function RouteErrorPage() {
  const { t } = useTranslation()
  const error = useRouteError()
  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : undefined
  return (
    <div className="h-full bg-app">
      <StatusMessage icon={TriangleAlert} message={t('status.unexpected')} detail={detail} />
    </div>
  )
}
