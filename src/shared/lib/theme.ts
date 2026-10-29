/** Design token from spec section 8 (see app/styles/index.css), for canvas-based libraries. */
export function cssVar(name: `--${string}`): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

/** "#36c5f0" + 0.3 -> "rgba(54, 197, 240, 0.3)", for chart gradients. */
export function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16))
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
