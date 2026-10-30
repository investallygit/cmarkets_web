import { createBrowserRouter } from 'react-router'
import { NotFoundPage, RouteErrorPage } from '@/pages/status'
import { SCREENS } from '@/shared/routes/screens'
import type { ScreenRouteHandle } from '@/shared/routes/useCurrentRoute'
import { AppShell } from '../layouts/AppShell'
import { HomeRedirect } from './HomeRedirect'
import { pageOf } from './pages'
import { ScreenRoute } from './ScreenRoute'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomeRedirect /> },
      ...SCREENS.map((screen) => ({
        path: screen.path,
        element: <ScreenRoute screen={screen} page={pageOf(screen)} />,
        handle: { screen } satisfies ScreenRouteHandle,
      })),
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
