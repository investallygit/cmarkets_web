import type { UseQueryResult } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { PanelEmpty, PanelError, PanelLoading } from './StatusViews'

interface QueryViewProps<T> {
  query: UseQueryResult<T>
  children: (data: T) => ReactNode
  isEmpty?: (data: T) => boolean
  emptyMessage?: string
}

/** Loading, error and empty states of a panel body, so panels only render data. */
export function QueryView<T>({ query, children, isEmpty, emptyMessage }: QueryViewProps<T>) {
  if (query.isPending) return <PanelLoading />
  if (query.isError) return <PanelError error={query.error} onRetry={() => void query.refetch()} />
  if (isEmpty?.(query.data)) return <PanelEmpty message={emptyMessage} />
  return <>{children(query.data)}</>
}
