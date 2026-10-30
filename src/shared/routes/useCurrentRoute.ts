import { useMatches, type Params } from 'react-router'
import type { ScreenDefinition } from './screens'

export interface ScreenRouteHandle {
  screen: ScreenDefinition
}

function screenOf(handle: unknown): ScreenDefinition | undefined {
  return (handle as Partial<ScreenRouteHandle> | undefined)?.screen
}

/** Screen and params of the deepest matched route, readable from the shell above the screens. */
export function useCurrentRoute(): { screen: ScreenDefinition | null; params: Params } {
  const match = useMatches().findLast((candidate) => screenOf(candidate.handle))
  return { screen: screenOf(match?.handle) ?? null, params: match?.params ?? {} }
}
