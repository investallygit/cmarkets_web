import { Suspense } from 'react'
import { createBrowserRouter } from 'react-router'
import { NotFoundPage, RouteErrorPage } from '@/pages/status'
import { env } from '@/shared/config/env'
import { routes } from '@/shared/routes/paths'
import { SCREENS } from '@/shared/routes/screens'
import type { ScreenRouteHandle } from '@/shared/routes/useCurrentRoute'
import { PanelLoading } from '@/shared/ui/StatusViews'
import { AppShell } from '../layouts/AppShell'
import { FullScreenStatus } from '../layouts/FullScreenStatus'
import { HomeRedirect } from './HomeRedirect'
import { HomePage, LoginPage, pageOf, PasswordResetPage, SignUpPage, UiKitPage } from './pages'
import { RequireSession } from './RequireSession'
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

// The home page and the login pages need no session: they are outside the app shell, in the brand
// colours (spec section 8).
const publicRoutes = [
  { path: routes.home, element: <HomePage /> },
  { path: routes.login, element: <LoginPage /> },
  { path: routes.signUp, element: <SignUpPage /> },
  { path: routes.resetPassword, element: <PasswordResetPage /> },
].map(({ path, element }) => ({
  path,
  element: <Suspense fallback={<FullScreenStatus kind="loading" />}>{element}</Suspense>,
  errorElement: <RouteErrorPage />,
}))

export const router = createBrowserRouter([
  ...publicRoutes,
  {
    element: (
      <RequireSession>
        <AppShell />
      </RequireSession>
    ),
    errorElement: <RouteErrorPage />,
    children: [
      { path: routes.app, element: <HomeRedirect /> },
      ...SCREENS.map((screen) => ({
        path: screen.routePattern ?? screen.path,
        element: <ScreenRoute screen={screen} page={pageOf(screen)} />,
        handle: { screen } satisfies ScreenRouteHandle,
      })),
      ...prototypeRoutes,
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
