import { Navigate } from 'react-router'
import { homePathFor, useCurrentUser } from '@/entities/session'
import { SCREENS } from '@/shared/routes/screens'

export function HomeRedirect() {
  const user = useCurrentUser()
  return <Navigate to={homePathFor(user, SCREENS)} replace />
}
