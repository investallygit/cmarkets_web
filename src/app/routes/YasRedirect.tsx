import { Navigate, useParams } from 'react-router'
import { bondPricingPath } from '@/shared/routes/paths'

/** YAS opens BP, bond pricing (spec section 8): an address of the calculator before it goes there. */
export function YasRedirect() {
  const { bondId } = useParams()
  return <Navigate to={bondPricingPath(bondId)} replace />
}
