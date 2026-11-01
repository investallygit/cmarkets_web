import type { LayoutArrangementDto, LayoutItemDto } from '@/shared/api/contracts'
import type { StoredLayout } from '../db'

const SAVED_LAYOUTS_MAX = 10
const LAYOUT_NAME_MAX = 40

const isLayoutItem = (value: unknown): value is LayoutItemDto => {
  const item = value as Partial<LayoutItemDto> | null
  return (
    typeof item?.i === 'string' &&
    [item.x, item.y].every((n) => Number.isInteger(n) && (n as number) >= 0) &&
    [item.w, item.h].every((n) => Number.isInteger(n) && (n as number) >= 1)
  )
}

const isIdList = (value: unknown) =>
  value === undefined || (Array.isArray(value) && value.every((id) => typeof id === 'string'))

function arrangementError(value: Partial<LayoutArrangementDto>): string | null {
  if (!Array.isArray(value.items) || !value.items.every(isLayoutItem)) {
    return 'items must list the panels in grid units.'
  }
  return isIdList(value.hidden) && isIdList(value.stacked)
    ? null
    : 'hidden and stacked must list panel ids.'
}

/** Why a screen's layout cannot be saved, or null: what the server checks of a PUT. */
export function layoutError(layout: Partial<StoredLayout>): string | null {
  const error = arrangementError(layout)
  if (error) return error
  if (layout.locked !== undefined && typeof layout.locked !== 'boolean') {
    return 'locked must be true or false.'
  }
  if (layout.saved === undefined) return null
  if (!Array.isArray(layout.saved) || layout.saved.length > SAVED_LAYOUTS_MAX) {
    return `saved holds up to ${SAVED_LAYOUTS_MAX} layouts.`
  }
  const names = new Set<string>()
  for (const saved of layout.saved) {
    const name = typeof saved?.name === 'string' ? saved.name.trim() : ''
    if (name === '' || name.length > LAYOUT_NAME_MAX) {
      return `A saved layout needs a name of 1 to ${LAYOUT_NAME_MAX} characters.`
    }
    if (names.has(name.toLowerCase())) return `Two saved layouts are named "${name}".`
    names.add(name.toLowerCase())
    const nested = arrangementError(saved)
    if (nested) return nested
  }
  return null
}
