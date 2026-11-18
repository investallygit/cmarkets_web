import { useTranslation } from 'react-i18next'
import { useChartDrawings, useSaveChartDrawings } from '@/entities/chart-drawing'
import type { ChartDrawingDto } from '@/shared/api/contracts'
import type { ChartDrawingInput } from '@/shared/ui/charts/PriceChart'
import { toast } from '@/shared/ui/toast'

const NO_DRAWINGS: ChartDrawingDto[] = []

/**
 * The user's lines on a security's chart, and the edits that save them. Each edit saves the whole
 * list, so nothing is saved until the list has been read: lines that could not be loaded are never
 * saved over (B48). `failed` says so; `retry` reads them again.
 */
export function useDrawings(securityId: string) {
  const { t } = useTranslation()
  const query = useChartDrawings(securityId)
  const drawings = query.data?.drawings ?? NO_DRAWINGS
  const save = useSaveChartDrawings(securityId)
  const ready = query.isSuccess

  const commit = (next: ChartDrawingDto[]) => {
    if (!ready) return
    save.mutate(next, {
      onError: (error) => toast.error(t('chart.draw.saveFailed', { message: error.message })),
    })
  }

  return {
    drawings,
    ready,
    failed: query.isError,
    retry: () => void query.refetch(),
    add: (drawing: ChartDrawingInput) =>
      commit([...drawings, { ...drawing, id: crypto.randomUUID() }]),
    undo: () => commit(drawings.slice(0, -1)),
    clear: () => commit([]),
  }
}
