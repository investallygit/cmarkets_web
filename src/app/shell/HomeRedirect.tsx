import { Navigate } from 'react-router'
import { useCurrentUser } from '@/features/session'
import { homePathFor } from '../navigation/access'
import { SCREENS } from '../navigation/screens'

export function HomeRedirect() {
  const user = useCurrentUser()
  return <Navigate to={homePathFor(user, SCREENS)} replace />
}
