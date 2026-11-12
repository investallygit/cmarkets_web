import { clsx } from 'clsx'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEtfAllocation, useEtfLabels } from '@/entities/etf'
import type { EtfAllocationBy, HoldingRegion, HoldingSector } from '@/shared/api/contracts'
import { withAlpha } from '@/shared/lib/theme'
import { AllocationBar } from '@/shared/ui/charts/AllocationBar'
import { useChartTheme } from '@/shared/ui/charts/chartTheme'
import { Panel } from '@/shared/ui/Panel'
import { PanelTabs } from '@/shared/ui/PanelTabs'
import { QueryView } from '@/shared/ui/QueryView'
import { foldAllocation, OTHER } from '../lib/portfolio'

const VIEWS: readonly EtfAllocationBy[] = ['sector', 'region']

/** The mockup's colours in their order: blue, green, pink, orange, purple, amber; grey for Other. */
const COLOR_SLOTS = [0, 2, 4, 1, 6, 3]

interface EtfAllocationPanelProps {
  etfId: string
  /** One breakdown, without tabs (HLD); DES's offers both, [SECTOR] · REGION. */
  by?: EtfAllocationBy
}

/**
 * Screen 19, allocation: a stacked bar and its legend, by sector or by region, the six largest
 * classes and the rest as "Other". API /etfs/{id}/allocation?by=sector|region.
 */
export function EtfAllocationPanel({ etfId, by: fixed }: EtfAllocationPanelProps) {
  const { t } = useTranslation()
  const [chosen, setChosen] = useState<EtfAllocationBy>('sector')
  const by = fixed ?? chosen
  const allocation = useEtfAllocation(etfId, by)
  const title =
    fixed === 'sector'
      ? t('panels.etfSectors')
      : fixed === 'region'
        ? t('panels.etfRegions')
        : t('panels.etfAllocation')
  return (
    <Panel
      title={title}
      code="HLD"
      options={
        fixed ? null : (
          <PanelTabs
            value={chosen}
            options={VIEWS.map((value) => ({
              value,
              label: t(`etfProfile.allocation.views.${value}`),
            }))}
            onChange={setChosen}
          />
        )
      }
    >
      <QueryView query={allocation}>
        {(data) =>
          data.items.length === 0 ? (
            <p className="p-3 font-sans text-data text-secondary">
              {t(`etfProfile.allocation.empty.${data.by}`)}
            </p>
          ) : (
            <div className={clsx('h-full', allocation.isPlaceholderData && 'opacity-60')}>
              <Breakdown items={data.items} by={data.by} />
            </div>
          )
        }
      </QueryView>
    </Panel>
  )
}

function Breakdown({
  items,
  by,
}: {
  items: { key: HoldingSector | HoldingRegion; weightPct: number }[]
  by: EtfAllocationBy
}) {
  const { t } = useTranslation()
  const labels = useEtfLabels()
  const theme = useChartTheme()
  const rows = useMemo(() => {
    const neutral = withAlpha(theme.secondary, 0.45)
    return foldAllocation(items).map((row, index) => ({
      key: row.key,
      weightPct: row.weightPct,
      label:
        row.key === OTHER
          ? t('etfProfile.allocation.other')
          : by === 'sector'
            ? labels.holdingSector(row.key as HoldingSector)
            : labels.region(row.key as HoldingRegion),
      color: row.key === OTHER ? neutral : (theme.series[COLOR_SLOTS[index] ?? index] ?? neutral),
    }))
  }, [items, by, t, labels, theme])
  return <AllocationBar rows={rows} />
}
