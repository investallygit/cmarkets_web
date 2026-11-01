import type { LayoutArrangementDto, LayoutItemDto } from '@/shared/api/contracts'
import type { PanelNameKey } from '@/shared/i18n'
import { WORKSPACE_COLUMNS, type WorkspaceItem } from '@/shared/ui/Workspace'
import { compactLayout, placePanel } from '@/shared/ui/workspaceLayout'
import { mergeLayout } from './mergeLayout'

/** A panel of a screen as its page declares it: its place in the mockup, and its name. */
export interface ScreenPanel extends WorkspaceItem {
  /** What the layout menu calls it once hidden (panels.*); its title may say more. */
  name: PanelNameKey
}

/** Where the panels are, which are hidden and their order stacked: what undo goes back to. */
export interface Arrangement {
  items: LayoutItemDto[]
  hidden: string[]
  stacked?: string[]
}

/** The screen's default: the mockup's places, every panel shown, stacked row by row. */
export const DEFAULT_ARRANGEMENT: Arrangement = { items: [], hidden: [], stacked: undefined }

export function arrangementOf(layout: LayoutArrangementDto): Arrangement {
  return { items: layout.items, hidden: layout.hidden ?? [], stacked: layout.stacked }
}

/** What the screen shows of an arrangement. */
export interface ScreenView {
  /** The panels shown, packed as the grid packs them. */
  layout: WorkspaceItem[]
  /** The same panels in their order stacked in one column. */
  stacked: string[]
  /** The hidden panels, in the order of the page. */
  hidden: string[]
}

export function viewOf(defaults: readonly WorkspaceItem[], arrangement: Arrangement): ScreenView {
  const all = mergeLayout(defaults, arrangement.items)
  const hidden = new Set(arrangement.hidden)
  const shown = all.filter((item) => !hidden.has(item.i))
  // Never an empty screen, which would have no menu left to show a panel back from.
  const visible = shown.length > 0 ? shown : all
  const ids = new Set(visible.map((item) => item.i))
  return {
    layout: compactLayout(visible, WORKSPACE_COLUMNS),
    stacked: stackOrder(all, arrangement.stacked).filter((id) => ids.has(id)),
    hidden: all.filter((item) => !ids.has(item.i)).map((item) => item.i),
  }
}

/** Every panel in its one-column order: the order saved, then the others row by row. */
function stackOrder(all: readonly WorkspaceItem[], stacked: readonly string[] = []): string[] {
  const ids = new Set(all.map((item) => item.i))
  const saved = [...new Set(stacked)].filter((id) => ids.has(id))
  const rest = [...all]
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .map((item) => item.i)
    .filter((id) => !saved.includes(id))
  return [...saved, ...rest]
}

const positions = (layout: readonly WorkspaceItem[]): LayoutItemDto[] =>
  layout.map(({ i, x, y, w, h }) => ({ i, x, y, w, h }))

/** The shown panels where the grid put them; the hidden ones keep their place. */
export function withGrid(
  defaults: readonly WorkspaceItem[],
  arrangement: Arrangement,
  shown: readonly WorkspaceItem[],
): Arrangement {
  const kept = mergeLayout(defaults, arrangement.items).filter((item) =>
    arrangement.hidden.includes(item.i),
  )
  return { ...arrangement, items: positions([...shown, ...kept]) }
}

/** A panel hidden: the others pack up, and it keeps its place to come back to. */
export function hidePanel(
  defaults: readonly WorkspaceItem[],
  arrangement: Arrangement,
  id: string,
): Arrangement {
  const all = mergeLayout(defaults, arrangement.items)
  const hidden = [...new Set([...arrangement.hidden, id])]
  const shown = all.filter((item) => !hidden.includes(item.i))
  if (shown.length === 0) return arrangement
  const kept = all.filter((item) => hidden.includes(item.i))
  return {
    ...arrangement,
    items: positions([...compactLayout(shown, WORKSPACE_COLUMNS), ...kept]),
    hidden,
  }
}

/** A hidden panel back at its place, the others making way. */
export function showPanel(
  defaults: readonly WorkspaceItem[],
  arrangement: Arrangement,
  id: string,
): Arrangement {
  const all = mergeLayout(defaults, arrangement.items)
  const hidden = arrangement.hidden.filter((other) => other !== id)
  const item = all.find((candidate) => candidate.i === id)
  if (!item) return { ...arrangement, hidden }
  const shown = all.filter((other) => other.i !== id && !hidden.includes(other.i))
  const kept = all.filter((other) => hidden.includes(other.i))
  return {
    ...arrangement,
    items: positions([...placePanel(shown, item, WORKSPACE_COLUMNS), ...kept]),
    hidden,
  }
}

/**
 * A stacked panel trades places with the nearest panel shown above (-1) or below (1); the
 * hidden ones keep theirs in the order, to come back to.
 */
export function moveStacked(
  defaults: readonly WorkspaceItem[],
  arrangement: Arrangement,
  id: string,
  delta: -1 | 1,
): Arrangement {
  const order = stackOrder(mergeLayout(defaults, arrangement.items), arrangement.stacked)
  const shown = new Set(viewOf(defaults, arrangement).stacked)
  const from = order.indexOf(id)
  let to = from + delta
  while (to >= 0 && to < order.length && !shown.has(order[to] ?? '')) to += delta
  const other = order[to]
  if (from < 0 || other === undefined) return arrangement
  order[to] = id
  order[from] = other
  return { ...arrangement, stacked: order }
}

/** Names of saved layouts compare without case or outer spaces: "Morning" replaces "morning ". */
export function sameLayoutName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}
