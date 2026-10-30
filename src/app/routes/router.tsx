import { Suspense } from 'react'
import { createBrowserRouter } from 'react-router'
import { NotFoundPage, RouteErrorPage } from '@/pages/status'
import { env } from '@/shared/config/env'
import { SCREENS } from '@/shared/routes/screens'
import type { ScreenRouteHandle } from '@/shared/routes/useCurrentRoute'
import { PanelLoading } from '@/shared/ui/StatusViews'
import { AppShell } from '../layouts/AppShell'
import { HomeRedirect } from './HomeRedirect'
import { pageOf, UiKitPage } from './pages'
import { ScreenRoute } from './ScreenRoute'

const prototypeRoutes = env.useMocks
  ? [
      {
        path: '/_kit',
        element: (
          <Suspense fallback={<PanelLoading />}>
            <UiKitPage />
          </Suspense>
        ),
      },
    ]
  : []

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
      ...prototypeRoutes,
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
