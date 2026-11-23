# Step 59 · Tabs open across a release, the client's report (S): done

Step 59 of the [roadmap](../../ROADMAP.md#order), built on 24 November 2026.

No CMarket.Api phase.

On 23 November 2026, after the fifth version's release, the client wrote: "I was checking I can
still see errors while opening some screens", without a screen, an account or a time.

## Checked (23 November 2026)

- **The live site** (web 7b22f4b, CMarket.Api 79d15c8), read only: eleven demo accounts and a
  visitor, every screen of each at 1600 px, 638 visits: no page error, no 5xx, no 4xx but at the
  addresses wrong on purpose and before a login. The menu again in WebKit (K. Atangana) and in
  Chromium (P. Owona), in the app and by address: the same.
- **What fails**: a tab opened before a release. The release takes away the files of the build
  before (`/assets/*` answers 404), and each page is a file loaded on first visit: every screen the
  tab had not opened yet showed "Something went wrong on this screen. Failed to fetch dynamically
  imported module…", without the menu, until the browser's reload. 16 of the menu's 17 entries, on
  the live site with the files answered as it answers those of another build.
- It fits what the client says; it is not proven to be what they saw.

## Built

- `lazyPage` (`shared/lib/lazyPage.ts`), for every page of `app/routes/pages.ts`: when a page's
  files do not come, `reloadForNewBuild` (`shared/lib/newBuild.ts`) asks the site which build it
  serves. Another one: the page is loaded again at the address asked for, once a build. The same
  one, or no answer: the error is shown. The parts of a page (the editors, a chart) reload nothing,
  so as not to lose what the user is writing.
- A screen that fails shows its error inside the shell: the menu stays and opens another.
- The error offers "Reload the page"; files that did not come say "This screen could not be
  loaded: check your connection, then reload the page." rather than the browser's message.
- The page sweep counts that message as a crash, and `--readonly` lets DL's preview through, which
  computes and writes nothing.

## Checked after

- Two production builds, one swapped for the other under an open tab: before, every screen of the
  menu but MKT fails; now they all open, with one reload.
- Vitest (`newBuild`, `RouteErrorPage`) and two flows of `e2e/smoke.spec.ts`: a release under an
  open tab, and files that do not come.

## Left

- A tab opened before this step's own release still needs the browser's reload, once.
- A release: CMarket.Api first, the web once it is live. On 23 November the web came about two
  minutes before the API, whose restarts (three that day) may also have shown panels in error.
