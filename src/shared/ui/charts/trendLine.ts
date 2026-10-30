import type {
  IChartApiBase,
  IPrimitivePaneRenderer,
  IPrimitivePaneView,
  ISeriesApi,
  ISeriesPrimitive,
  Logical,
  SeriesAttachedParameter,
  SeriesType,
  Time,
} from 'lightweight-charts'

type RenderTarget = Parameters<IPrimitivePaneRenderer['draw']>[0]

export interface ChartPoint {
  time: Time
  price: number
}

/**
 * A segment drawn by the user between two points of a price chart (spec section 3). Times are
 * matched to the nearest bar, so a line drawn on daily bars also shows on weekly bars.
 */
export class TrendLine implements ISeriesPrimitive<Time> {
  private chart: IChartApiBase<Time> | null = null
  private series: ISeriesApi<SeriesType, Time> | null = null
  private readonly views: readonly IPrimitivePaneView[]
  private readonly from: ChartPoint
  private readonly to: ChartPoint
  private readonly color: string

  constructor(from: ChartPoint, to: ChartPoint, color: string) {
    this.from = from
    this.to = to
    this.color = color
    const renderer: IPrimitivePaneRenderer = { draw: (target) => this.draw(target) }
    this.views = [{ renderer: () => renderer }]
  }

  attached({ chart, series, requestUpdate }: SeriesAttachedParameter<Time>): void {
    this.chart = chart
    this.series = series
    requestUpdate()
  }

  detached(): void {
    this.chart = null
    this.series = null
  }

  paneViews(): readonly IPrimitivePaneView[] {
    return this.views
  }

  private x(time: Time): number | null {
    if (!this.chart) return null
    const timeScale = this.chart.timeScale()
    const index = timeScale.timeToIndex(time, true)
    return index === null ? null : timeScale.logicalToCoordinate(index as number as Logical)
  }

  private y(price: number): number | null {
    return this.series ? this.series.priceToCoordinate(price) : null
  }

  private draw(target: RenderTarget): void {
    const x1 = this.x(this.from.time)
    const x2 = this.x(this.to.time)
    const y1 = this.y(this.from.price)
    const y2 = this.y(this.to.price)
    if (x1 === null || x2 === null || y1 === null || y2 === null) return
    target.useBitmapCoordinateSpace(({ context, horizontalPixelRatio, verticalPixelRatio }) => {
      context.save()
      context.strokeStyle = this.color
      context.fillStyle = this.color
      context.lineWidth = Math.max(1, Math.round(1.5 * horizontalPixelRatio))
      context.beginPath()
      context.moveTo(x1 * horizontalPixelRatio, y1 * verticalPixelRatio)
      context.lineTo(x2 * horizontalPixelRatio, y2 * verticalPixelRatio)
      context.stroke()
      for (const [x, y] of [
        [x1, y1],
        [x2, y2],
      ]) {
        context.beginPath()
        context.arc(
          x * horizontalPixelRatio,
          y * verticalPixelRatio,
          3 * horizontalPixelRatio,
          0,
          2 * Math.PI,
        )
        context.fill()
      }
      context.restore()
    })
  }
}
