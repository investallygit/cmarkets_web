/** The site's build a reload was made for, in this tab: one reload a build, never a loop. */
const RELOADED_FOR = 'cmarket.reloadedFor'

const entriesOf = (page: Document) =>
  [...page.querySelectorAll('script[type="module"][src]')].map(
    (script) => script.getAttribute('src') ?? '',
  )

/** The entry scripts the site serves now, if this page did not start from them. */
async function newEntries(): Promise<string | null> {
  const response = await fetch('/', { cache: 'no-store' })
  if (!response.ok) return null
  const served = entriesOf(new DOMParser().parseFromString(await response.text(), 'text/html'))
  const running = entriesOf(document)
  return served.some((entry) => !running.includes(entry)) ? served.join(' ') : null
}

/**
 * Loads the page again if the site has been released since this tab opened: the release took away
 * the files of the build the tab runs. Answers false, and does nothing, when the build is the same
 * one, when the site is out of reach, or when the tab was already reloaded for that build.
 */
export async function reloadForNewBuild(reload = () => window.location.reload()): Promise<boolean> {
  try {
    const build = await newEntries()
    if (!build || sessionStorage.getItem(RELOADED_FOR) === build) return false
    sessionStorage.setItem(RELOADED_FOR, build)
  } catch {
    return false
  }
  reload()
  return true
}
