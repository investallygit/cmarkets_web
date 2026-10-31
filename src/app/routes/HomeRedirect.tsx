import { Navigate } from 'react-router'
import { homePathFor, useCurrentUser } from '@/entities/session'
import { SCREENS } from '@/shared/routes/screens'

/** /app: the home screen of the account type, e.g. after login or from the home page. */
export function HomeRedirect() {
  const user = useCurrentUser()
  return <Navigate to={homePathFor(user, SCREENS)} replace />
}
