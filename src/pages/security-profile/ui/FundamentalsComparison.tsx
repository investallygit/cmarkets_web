import { useMemo } from 'react'
import { useSecurities } from '@/entities/security'
import type { SecurityProfileDto } from '@/shared/api/contracts'
import { PeerComparisonPanel } from '@/widgets/peer-comparison-panel'

/** FA tab: the equity against the other equities of its market, its sector first. */
export function FundamentalsComparison({ security }: { security: SecurityProfileDto }) {
  const equities = useSecurities({ type: 'equity', market: security.exchange })
  const peerIds = useMemo(
    () =>
      (equities.data ?? [])
        .filter((peer) => peer.id !== security.id)
        .sort((a, b) => Number(b.sector === security.sector) - Number(a.sector === security.sector))
        .map((peer) => peer.id),
    [equities.data, security.id, security.sector],
  )
  return <PeerComparisonPanel securityId={security.id} peerIds={peerIds} />
}
