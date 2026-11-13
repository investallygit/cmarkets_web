import { useTranslation } from 'react-i18next'
import { useXafCrosses } from '@/entities/rate'
import { useFormat } from '@/shared/i18n'
import { Badge } from '@/shared/ui/Badge'
import { PARITY_DECIMALS, XAF_PARITY } from '../lib/fxDecimals'

/**
 * Screen 26's header (spec section 9): the fixed parity, 1 EUR = 655.957 XAF, and the day of the
 * ECB's reference rates the crosses are computed from, as the mockup writes it.
 * API /fx/xaf-crosses.
 */
export function FxHeader() {
  const { t } = useTranslation()
  const format = useFormat()
  const crosses = useXafCrosses().data
  return (
    <section
      aria-label={t('screens.FX.title')}
      className="flex flex-wrap items-center gap-x-4 gap-y-1 border bg-panel px-3 py-2"
    >
      <p className="font-mono text-figure font-semibold text-accent-amber tabular-nums">
        {t('fx.parity', {
          parity: format.number(crosses?.parity ?? XAF_PARITY, PARITY_DECIMALS),
        })}
      </p>
      <p className="min-w-0 flex-1 basis-80 font-sans text-label text-primary">
        {crosses?.date
          ? t('fx.parityNote', { date: format.isoDate(crosses.date) })
          : t('fx.parityNoteNone')}
      </p>
      <Badge tone="info">{t('fx.ecbReference')}</Badge>
    </section>
  )
}
