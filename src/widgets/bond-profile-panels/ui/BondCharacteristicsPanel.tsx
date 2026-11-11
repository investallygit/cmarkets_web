import { useTranslation } from 'react-i18next'
import { useBond } from '@/entities/bond'
import type { BondDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { DASH, useBondWords } from '../lib/words'
import { FigureRows, type FigureRow } from './FigureRows'

/**
 * Screen 20, characteristics: issuer, category and sector, seniority, coupon and its type,
 * frequency and day count, issue and maturity, redemption, early redemption, amount outstanding;
 * a payment status other than performing. API /bonds/{id}.
 */
export function BondCharacteristicsPanel({ bondId }: { bondId: string }) {
  const { t } = useTranslation()
  const bond = useBond(bondId)
  return (
    <Panel title={t('panels.bondCharacteristics')} code="DES" bodyClassName="overflow-y-auto">
      <QueryView query={bond}>{(data) => <Characteristics bond={data} />}</QueryView>
    </Panel>
  )
}

function Characteristics({ bond }: { bond: BondDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const words = useBondWords()
  const rows: FigureRow[] = [
    { label: t('bondProfile.characteristics.issuer'), value: bond.issuer },
    { label: t('bondProfile.characteristics.categorySector'), value: words.categorySector(bond) },
    {
      label: t('bondProfile.characteristics.seniority'),
      value: t(`bondScreener.seniorities.${bond.seniority}`),
    },
    { label: t('bondProfile.characteristics.coupon'), value: words.coupon(bond) },
    {
      // A zero coupon pays no coupon: no frequency.
      label: t('bondProfile.characteristics.frequency'),
      value: `${bond.couponType === 'zero' ? DASH : words.frequency(bond.frequency)} · ${bond.dayCount}`,
    },
    {
      label: t('bondProfile.characteristics.dates'),
      value: `${format.isoDate(bond.issueDate)} · ${format.isoDate(bond.maturityDate)}`,
    },
    ...(bond.firstCouponDate
      ? [
          {
            label: t('bondProfile.characteristics.firstCoupon'),
            value: format.isoDate(bond.firstCouponDate),
          },
        ]
      : []),
    { label: t('bondProfile.characteristics.redemption'), value: words.redemption(bond) },
    {
      label: t('bondProfile.characteristics.earlyRedemption'),
      value: words.options(bond.calls, bond.puts),
    },
    {
      label: t('bondProfile.characteristics.amountOutstanding'),
      value: `${bond.currency} ${format.compact(bond.amountOutstanding)}`,
    },
    ...(bond.status === 'performing'
      ? []
      : [
          {
            label: t('bondProfile.characteristics.status'),
            value: t(`bondScreener.statuses.${bond.status}`),
            warning: true,
          },
        ]),
  ]
  return <FigureRows rows={rows} />
}
