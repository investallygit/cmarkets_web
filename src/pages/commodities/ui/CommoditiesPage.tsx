import { Navigate } from 'react-router'
import { securityPath } from '@/shared/routes/paths'
import { DEFAULT_COMMODITY } from '../config/defaultCommodity'

/**
 * CMDTY (screen 21): the commodities. It opens the profile of Brent, as the mockup, which shows
 * the list of every series on its left (ROADMAP decision 19: the profile of a commodity is the
 * fourth of DES, at /securities/{code}).
 */
export function CommoditiesPage() {
  return <Navigate to={securityPath(DEFAULT_COMMODITY)} replace />
}
