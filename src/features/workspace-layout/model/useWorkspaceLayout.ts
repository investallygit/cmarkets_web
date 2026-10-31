import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { apiClient, isApiError } from '@/shared/api'
import type { LayoutItemDto, ScreenLayoutDto } from '@/shared/api/contracts'
import type { WorkspaceItem } from '@/shared/ui/Workspace'
import { mergeLayout, samePositions } from '../lib/mergeLayout'

const SAVE_DELAY_MS = 800

export const layoutKeys = { all: ['layouts'] as const }

function layoutPath(screen: string): string {
  return `/me/layouts/${encodeURIComponent(screen)}`
}

async function fetchLayout(screen: string, signal: AbortSignal): Promise<ScreenLayoutDto> {
  try {
    return await apiClient.get<ScreenLayoutDto>(layoutPath(screen), { signal })
  } catch (error) {
    // Never saved: no positions, so every panel keeps its default place.
    if (isApiError(error, 404)) return { screen, items: [] }
    throw error
  }
}

function layoutQuery(screen: string) {
  return queryOptions({
    queryKey: [...layoutKeys.all, screen] as const,
    queryFn: ({ signal }) => fetchLayout(screen, signal),
    staleTime: Infinity,
  })
}

/** Panel layout of a screen, saved per user (spec section 8) through /me/layouts/{screen}. */
export function useWorkspaceLayout(screen: string, defaults: readonly WorkspaceItem[]) {
  const queryClient = useQueryClient()
  const query = useQuery(layoutQuery(screen))
  const layout = useMemo(() => mergeLayout(defaults, query.data?.items), [defaults, query.data])

  const pending = useRef<LayoutItemDto[] | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const flush = useCallback(() => {
    window.clearTimeout(timer.current)
    const items = pending.current
    pending.current = null
    if (!items) return
    apiClient
      .put<void>(layoutPath(screen), { items })
      .catch((error: unknown) => console.warn('[layout] could not save', error))
  }, [screen])

  // Save what is still pending when the user leaves the screen.
  useEffect(() => flush, [flush])

  const onLayoutChange = useCallback(
    (next: readonly WorkspaceItem[]) => {
      const items = next.map(({ i, x, y, w, h }) => ({ i, x, y, w, h }))
      if (samePositions(items, layout)) return
      queryClient.setQueryData(layoutQuery(screen).queryKey, { screen, items })
      pending.current = items
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(flush, SAVE_DELAY_MS)
    },
    [flush, layout, queryClient, screen],
  )

  /** One step from a panel's menu: saved at once, a reload just after it keeps it. */
  const onLayoutCommit = useCallback(
    (next: readonly WorkspaceItem[]) => {
      onLayoutChange(next)
      flush()
    },
    [onLayoutChange, flush],
  )

  /** Back to the defaults of the screen: no position saved, so none to merge. */
  const reset = useCallback(() => {
    window.clearTimeout(timer.current)
    pending.current = null
    queryClient.setQueryData(layoutQuery(screen).queryKey, { screen, items: [] })
    apiClient
      .put<void>(layoutPath(screen), { items: [] })
      .catch((error: unknown) => console.warn('[layout] could not save', error))
  }, [queryClient, screen])

  return { layout, isReady: !query.isPending, onLayoutChange, onLayoutCommit, reset }
}
