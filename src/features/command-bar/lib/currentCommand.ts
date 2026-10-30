import type { Params } from 'react-router'
import type { ScreenDefinition } from '@/shared/routes/screens'

/** Command shown in the bar for the current screen, e.g. "SEMC DES". */
export function commandOf(screen: ScreenDefinition | null, params: Params): string {
  if (!screen) return ''
  if (screen.id === 'DES') return `${params.securityId ?? ''} ${(params.fn ?? 'des').toUpperCase()}`
  if (screen.id === 'YAS') return `${params.bondId ?? ''} YAS`
  return screen.code
}
