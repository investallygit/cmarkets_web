import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import { reloadForNewBuild } from './newBuild'

/** A page whose files could not be loaded: the connection, or a file the site lacks. */
export class PageLoadError extends Error {}

/**
 * A page in a chunk of its own, loaded on first visit. A tab opened before a release asks for
 * files the release took away: the page is then loaded from the new build, at the address the user
 * asked for. Only pages do so: a part of a page (an editor) reloads nothing the user is writing.
 */
// The constraint of React's own lazy: a page takes any props, or none.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyPage<T extends ComponentType<any>>(
  load: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await load()
    } catch (cause) {
      // The screen stays as it was, or "Loading", until the browser has left the page.
      if (await reloadForNewBuild()) return new Promise<{ default: T }>(() => {})
      throw new PageLoadError('The files of this page could not be loaded.', { cause })
    }
  })
}
