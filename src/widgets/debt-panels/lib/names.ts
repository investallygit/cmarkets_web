import { useTranslation } from 'react-i18next'
import { DEBT_ZONE, debtState } from '@/entities/debt'
import { useFormat } from '@/shared/i18n'

/** "Cameroon" for CMR, "CEMAC zone" for the zone: the name a title or a label gives a country of the bar. */
export function useDebtCountryName() {
  const { t } = useTranslation()
  const format = useFormat()
  return (code: string) => {
    if (code === DEBT_ZONE) return t('debt.zone')
    const state = debtState(code)
    return state ? format.country(state) : code
  }
}
