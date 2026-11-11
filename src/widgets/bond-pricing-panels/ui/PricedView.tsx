import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useBondPrice } from '@/entities/bond'
import type { BondPriceDto, BondPriceRequestDto } from '@/shared/api/contracts'
import { QueryView } from '@/shared/ui/QueryView'
import { PanelEmpty } from '@/shared/ui/StatusViews'

interface PricedViewProps {
  /** The inputs of the last Calculate; null before one. */
  request: BondPriceRequestDto | null
  /** The figures; `stale` while those of other inputs load. */
  children: (data: BondPriceDto, stale: boolean) => ReactNode
}

/** The figures of POST /bonds/price that the four panels of results share, one request for all. */
export function PricedView({ request, children }: PricedViewProps) {
  const { t } = useTranslation()
  const price = useBondPrice(request)
  if (request === null) return <PanelEmpty message={t('bondPricing.notCalculated')} />
  return <QueryView query={price}>{(data) => children(data, price.isPlaceholderData)}</QueryView>
}
