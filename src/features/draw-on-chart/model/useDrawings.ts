import { useTranslation } from 'react-i18next'
import { useChartDrawings, useSaveChartDrawings } from '@/entities/chart-drawing'
import type { ChartDrawingDto } from '@/shared/api/contracts'
import type { ChartDrawingInput } from '@/shared/ui/charts/PriceChart'
import { toast } from '@/shared/ui/toast'

const NO_DRAWINGS: ChartDrawingDto[] = []

/** The user's lines on a security's chart, and the edits that save them. */
export function useDrawings(securityId: string) {
  const { t } = useTranslation()
  const drawings = useChartDrawings(securityId).data?.drawings ?? NO_DRAWINGS
  const save = useSaveChartDrawings(securityId)

  const commit = (next: ChartDrawingDto[]) =>
    save.mutate(next, {
      onError: (error) => toast.error(t('chart.draw.saveFailed', { message: error.message })),
    })

  return {
    drawings,
    add: (drawing: ChartDrawingInput) =>
      commit([...drawings, { ...drawing, id: crypto.randomUUID() }]),
    undo: () => commit(drawings.slice(0, -1)),
    clear: () => commit([]),
  }
}
