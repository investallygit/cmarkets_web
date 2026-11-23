import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Suspense, type ComponentType } from 'react'
import { createMemoryRouter, Link, Outlet, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { lazyPage } from '@/shared/lib/lazyPage'
import { reloadForNewBuild } from '@/shared/lib/newBuild'
import { RouteErrorPage } from './RouteErrorPage'

vi.mock('@/shared/lib/newBuild', () => ({ reloadForNewBuild: vi.fn() }))

const missing = () =>
  Promise.reject<{ default: ComponentType }>(
    new TypeError('Failed to fetch dynamically imported module: /assets/eqs-old.js'),
  )

/** The shell's routes: a menu, and the errors of the screens inside it. */
function open(load: () => Promise<{ default: ComponentType }>) {
  const Page = lazyPage(load)
  const router = createMemoryRouter(
    [
      {
        element: (
          <>
            <Link to="/other">Menu</Link>
            <Outlet />
          </>
        ),
        children: [
          {
            errorElement: <RouteErrorPage />,
            children: [
              {
                path: '/eqs',
                element: (
                  <Suspense fallback="Loading">
                    <Page />
                  </Suspense>
                ),
              },
              { path: '/other', element: <p>Another screen</p> },
            ],
          },
        ],
      },
    ],
    { initialEntries: ['/eqs'] },
  )
  render(<RouterProvider router={router} />)
}

describe('a screen that fails', () => {
  beforeEach(() => void vi.spyOn(console, 'error').mockImplementation(() => {}))
  afterEach(() => vi.restoreAllMocks())

  it('keeps the menu, which opens another screen, and offers a reload', async () => {
    vi.mocked(reloadForNewBuild).mockResolvedValue(false)
    open(missing)
    expect(await screen.findByText(/could not be loaded/)).toBeVisible()
    expect(screen.queryByText(/dynamically imported/)).toBeNull()
    expect(screen.getByRole('button', { name: 'Reload the page' })).toBeVisible()
    await userEvent.click(screen.getByRole('link', { name: 'Menu' }))
    expect(await screen.findByText('Another screen')).toBeVisible()
  })

  it('shows no error while a new build is being loaded', async () => {
    vi.mocked(reloadForNewBuild).mockResolvedValue(true)
    open(missing)
    expect(await screen.findByText('Loading')).toBeVisible()
    await vi.waitFor(() => expect(reloadForNewBuild).toHaveBeenCalled())
    expect(screen.queryByRole('button', { name: 'Reload the page' })).toBeNull()
  })

  it('names the error of a screen that breaks', async () => {
    open(() =>
      Promise.resolve({
        default: () => {
          throw new Error('Broken figure')
        },
      }),
    )
    expect(await screen.findByText('Something went wrong on this screen.')).toBeVisible()
    expect(screen.getByText('Broken figure')).toBeVisible()
  })
})
