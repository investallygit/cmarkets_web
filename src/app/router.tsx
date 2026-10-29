import { createBrowserRouter } from 'react-router'
import { NotFoundScreen } from '@/screens/status/NotFoundScreen'
import { RouteErrorScreen } from '@/screens/status/RouteErrorScreen'
import { SCREENS } from './navigation/screens'
import { AppShell } from './shell/AppShell'
import { HomeRedirect } from './shell/HomeRedirect'
import { ScreenRoute } from './shell/ScreenRoute'
import type { ScreenRouteHandle } from './shell/useCurrentRoute'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    errorElement: <RouteErrorScreen />,
    children: [
      { index: true, element: <HomeRedirect /> },
      ...SCREENS.map((screen) => ({
        path: screen.path,
        element: <ScreenRoute screen={screen} />,
        handle: { screen } satisfies ScreenRouteHandle,
      })),
      { path: '*', element: <NotFoundScreen /> },
    ],
  },
])
