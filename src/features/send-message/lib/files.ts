/**
 * The files chosen that still fit beside those kept, in their order, and how many were left out:
 * only those are uploaded, so that no file is stored and scanned for nothing.
 */
export function fitFiles<T>(
  chosen: readonly T[],
  kept: number,
  max: number,
): { taken: T[]; dropped: number } {
  const room = Math.max(0, max - kept)
  return { taken: chosen.slice(0, room), dropped: Math.max(0, chosen.length - room) }
}
