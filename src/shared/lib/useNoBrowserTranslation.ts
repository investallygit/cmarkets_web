import { useLayoutEffect } from 'react'

/**
 * Keeps the browser from translating the page while the component is mounted, the dialogs it
 * opens in the body included. A translation swaps the text nodes for its own: those React then
 * updates are no longer on screen, so live figures freeze without a sign, and removing one, or
 * inserting before it, throws ("Failed to execute 'removeChild' on 'Node'"). Set during the
 * commit, before the translation sees what was just rendered.
 */
export function useNoBrowserTranslation() {
  useLayoutEffect(() => {
    document.documentElement.setAttribute('translate', 'no')
    return () => document.documentElement.removeAttribute('translate')
  }, [])
}
