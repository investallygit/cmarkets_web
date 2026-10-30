import type { LayoutItemDto } from '@/shared/api/contracts'
import type { WorkspaceItem } from '@/shared/ui/Workspace'

/** Saved positions win; panels added since the last save keep their default place. */
export function mergeLayout(
  defaults: readonly WorkspaceItem[],
  saved: readonly LayoutItemDto[] | undefined,
): WorkspaceItem[] {
  const savedById = new Map(saved?.map((item) => [item.i, item]))
  return defaults.map((item) => {
    const position = savedById.get(item.i)
    return position
      ? { ...item, x: position.x, y: position.y, w: position.w, h: position.h }
      : { ...item }
  })
}

export function samePositions(a: readonly LayoutItemDto[], b: readonly LayoutItemDto[]): boolean {
  if (a.length !== b.length) return false
  const byId = new Map(b.map((item) => [item.i, item]))
  return a.every((item) => {
    const other = byId.get(item.i)
    return (
      other !== undefined &&
      other.x === item.x &&
      other.y === item.y &&
      other.w === item.w &&
      other.h === item.h
    )
  })
}
