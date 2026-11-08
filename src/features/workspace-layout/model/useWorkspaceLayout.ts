import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { isApiError } from '@/shared/api'
import { meApi } from '@/shared/api/endpoints'
import type { NamedLayoutDto, ScreenLayoutDto } from '@/shared/api/contracts'
import type { WorkspaceItem } from '@/shared/ui/Workspace'
import {
  arrangementOf,
  DEFAULT_ARRANGEMENT,
  hidePanel,
  moveStacked,
  sameLayoutName,
  showPanel,
  viewOf,
  withGrid,
  type Arrangement,
  type ScreenPanel,
} from '../lib/arrangement'
import { samePositions } from '../lib/mergeLayout'

const SAVE_DELAY_MS = 800
/** The steps undo goes back, per screen. */
const HISTORY_MAX = 50
/** Layouts saved under a name, per screen. */
export const SAVED_LAYOUTS_MAX = 10

export const layoutKeys = { all: ['layouts'] as const }

/** After a drag, a few more may follow; a step from the menu is kept at once. */
type SaveTiming = 'now' | 'later'

interface History {
  past: Arrangement[]
  future: Arrangement[]
}

/** The cache's layout; unread: the server could not give it, so it is never saved over. */
type CachedLayout = ScreenLayoutDto & { unread?: true }

const NO_HISTORY: History = { past: [], future: [] }
const NO_SAVED: readonly NamedLayoutDto[] = []

async function fetchLayout(screen: string, signal: AbortSignal): Promise<ScreenLayoutDto> {
  try {
    return await meApi.layout(screen, signal)
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

/**
 * Panel layout of a screen, saved per user (spec section 8) through /me/layouts/{screen}: the
 * places in the grid, the hidden panels, their order stacked below 1280 px, the lock and the
 * layouts saved under a name. Undo and redo go through the changes made since the screen
 * opened, per tab.
 */
export function useWorkspaceLayout(screen: string, defaults: readonly ScreenPanel[]) {
  const queryClient = useQueryClient()
  const query = useQuery(layoutQuery(screen))
  const view = useMemo(
    () => viewOf(defaults, arrangementOf(query.data ?? { items: [] })),
    [defaults, query.data],
  )

  // The tabs of a screen (DES, DES-GP...) share this hook, each with its own history. The ref
  // is what the actions read, the state what the menu shows.
  const [histories, setHistories] = useState<Readonly<Record<string, History>>>({})
  const historiesRef = useRef(histories)
  const historyOf = useCallback(() => historiesRef.current[screen] ?? NO_HISTORY, [screen])
  const setHistory = useCallback(
    (history: History) => {
      historiesRef.current = { ...historiesRef.current, [screen]: history }
      setHistories(historiesRef.current)
    },
    [screen],
  )

  const pending = useRef<CachedLayout | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const flush = useCallback(() => {
    window.clearTimeout(timer.current)
    const layout = pending.current
    pending.current = null
    // Unread, its saved layouts and lock are unknown here: a PUT would delete them.
    if (!layout || layout.unread) return
    const { screen: id, ...body } = layout
    meApi
      .saveLayout(id, body)
      .catch((error: unknown) => console.warn('[layout] could not save', error))
  }, [])

  // Save what is still pending when the user leaves the screen, or the tab: a page that goes away
  // runs no React cleanup, hence pagehide (and the save is kept alive, see meApi.saveLayout).
  useEffect(() => {
    window.addEventListener('pagehide', flush)
    return () => {
      window.removeEventListener('pagehide', flush)
      flush()
    }
  }, [flush, screen])

  /**
   * The layout as the cache has it, with the changes not rendered yet. None when the server
   * could not give it: the screen then shows its default, and changes stay here.
   */
  const current = useCallback(
    (): CachedLayout =>
      queryClient.getQueryData(layoutQuery(screen).queryKey) ?? {
        screen,
        items: [],
        unread: true,
      },
    [queryClient, screen],
  )

  const write = useCallback(
    (layout: CachedLayout, timing: SaveTiming) => {
      queryClient.setQueryData(layoutQuery(layout.screen).queryKey, layout)
      pending.current = layout
      window.clearTimeout(timer.current)
      if (timing === 'now') flush()
      else timer.current = window.setTimeout(flush, SAVE_DELAY_MS)
    },
    [queryClient, flush],
  )

  /** A change undo takes back. */
  const change = useCallback(
    (next: Arrangement, timing: SaveTiming) => {
      const layout = current()
      const { past } = historyOf()
      setHistory({ past: [...past, arrangementOf(layout)].slice(-HISTORY_MAX), future: [] })
      write({ ...layout, ...next }, timing)
    },
    [current, historyOf, setHistory, write],
  )

  const placeInGrid = useCallback(
    (shown: readonly WorkspaceItem[], timing: SaveTiming) => {
      const before = arrangementOf(current())
      // The grid reports the layout it was given too, which changes nothing.
      if (samePositions(shown, viewOf(defaults, before).layout)) return
      change(withGrid(defaults, before, shown), timing)
    },
    [current, defaults, change],
  )
  const onLayoutChange = useCallback(
    (shown: readonly WorkspaceItem[]) => placeInGrid(shown, 'later'),
    [placeInGrid],
  )
  const onLayoutCommit = useCallback(
    (shown: readonly WorkspaceItem[]) => placeInGrid(shown, 'now'),
    [placeInGrid],
  )

  const step = useCallback(
    (transform: (before: Arrangement) => Arrangement) => {
      const before = arrangementOf(current())
      const next = transform(before)
      if (next !== before) change(next, 'now')
    },
    [current, change],
  )
  const onStackedMove = useCallback(
    (id: string, delta: -1 | 1) => step((before) => moveStacked(defaults, before, id, delta)),
    [step, defaults],
  )
  const hide = useCallback(
    (id: string) => step((before) => hidePanel(defaults, before, id)),
    [step, defaults],
  )
  const show = useCallback(
    (id: string) => step((before) => showPanel(defaults, before, id)),
    [step, defaults],
  )
  /** Back to the defaults of the screen: no position saved, nothing hidden; undo brings it back. */
  const reset = useCallback(() => change(DEFAULT_ARRANGEMENT, 'now'), [change])

  /** Undo or redo one change; false when there is none. */
  const travel = useCallback(
    (direction: 'undo' | 'redo'): boolean => {
      const { past, future } = historyOf()
      const target = direction === 'undo' ? past.at(-1) : future[0]
      if (!target) return false
      const layout = current()
      const now = arrangementOf(layout)
      setHistory(
        direction === 'undo'
          ? { past: past.slice(0, -1), future: [now, ...future] }
          : { past: [...past, now], future: future.slice(1) },
      )
      write({ ...layout, ...target }, 'now')
      return true
    },
    [historyOf, current, setHistory, write],
  )
  const undo = useCallback(() => travel('undo'), [travel])
  const redo = useCallback(() => travel('redo'), [travel])

  const setLocked = useCallback(
    (locked: boolean) => write({ ...current(), locked }, 'now'),
    [current, write],
  )

  /** The current layout under a name; one of the same name gives way. */
  const saveAs = useCallback(
    (name: string) => {
      const layout = current()
      const entry: NamedLayoutDto = { name, ...arrangementOf(layout) }
      const saved = layout.saved ?? []
      const replaced = saved.some((other) => sameLayoutName(other.name, name))
      write(
        {
          ...layout,
          saved: replaced
            ? saved.map((other) => (sameLayoutName(other.name, name) ? entry : other))
            : [...saved, entry],
        },
        'now',
      )
    },
    [current, write],
  )
  const apply = useCallback(
    (name: string) => {
      const entry = current().saved?.find((other) => sameLayoutName(other.name, name))
      if (entry) change(arrangementOf(entry), 'now')
    },
    [current, change],
  )
  const remove = useCallback(
    (name: string) => {
      const layout = current()
      const saved = (layout.saved ?? []).filter((other) => !sameLayoutName(other.name, name))
      write({ ...layout, saved }, 'now')
    },
    [current, write],
  )

  const history = histories[screen] ?? NO_HISTORY
  return {
    isReady: !query.isPending,
    /** The server could not give the layout: the default shows, and changes are not kept. */
    unread: query.isError || (query.data as CachedLayout | undefined)?.unread === true,
    ...view,
    locked: query.data?.locked ?? false,
    saved: query.data?.saved ?? NO_SAVED,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    onLayoutChange,
    onLayoutCommit,
    onStackedMove,
    hide,
    show,
    undo,
    redo,
    setLocked,
    saveAs,
    apply,
    remove,
    reset,
  }
}
