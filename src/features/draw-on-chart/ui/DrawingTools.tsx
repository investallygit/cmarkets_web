import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import type { DrawingTool } from '@/shared/ui/charts/PriceChart'

interface DrawingToolsProps {
  tool: DrawingTool | null
  onToolChange: (tool: DrawingTool | null) => void
  /** Lines already drawn: Undo and Clear need some. */
  count: number
  onUndo: () => void
  onClear: () => void
  /** Intraday bars or a comparison: no drawing. */
  disabled?: boolean
}

const TOOLS: readonly DrawingTool[] = ['trendline', 'horizontal']

/** Panel options of the price chart: drawing tools, the active one in brackets (spec section 9). */
export function DrawingTools({
  tool,
  onToolChange,
  count,
  onUndo,
  onClear,
  disabled = false,
}: DrawingToolsProps) {
  const { t } = useTranslation()
  const option =
    'panel-no-drag uppercase hover:text-primary disabled:text-secondary/50 disabled:hover:text-secondary/50'
  return (
    <div
      className="flex items-center gap-2"
      title={disabled ? t('chart.draw.unavailable') : undefined}
    >
      {TOOLS.map((candidate) => {
        const active = tool === candidate && !disabled
        return (
          <button
            key={candidate}
            type="button"
            aria-pressed={active}
            disabled={disabled}
            onClick={() => onToolChange(active ? null : candidate)}
            className={clsx(option, active && 'text-primary')}
          >
            {active ? `[${t(`chart.draw.${candidate}`)}]` : t(`chart.draw.${candidate}`)}
          </button>
        )
      })}
      <button type="button" disabled={disabled || count === 0} onClick={onUndo} className={option}>
        {t('chart.draw.undo')}
      </button>
      <button type="button" disabled={disabled || count === 0} onClick={onClear} className={option}>
        {t('chart.draw.clear')}
      </button>
    </div>
  )
}
