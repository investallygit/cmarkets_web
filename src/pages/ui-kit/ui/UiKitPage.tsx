import { ChartSample } from './ChartSample'
import { ButtonsSample, ChoicesSample } from './ControlsSample'
import { FieldsSample } from './FieldsSample'
import { OverlaysSample } from './OverlaysSample'
import { TableSample } from './TableSample'

/**
 * Prototype only (/_kit): the shared UI components with sample content, as a living style guide
 * until the screens use them. The labels are sample content, like the mock data, so they are not
 * in the translation files.
 */
export function UiKitPage() {
  return (
    <div className="h-full overflow-auto p-2">
      <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
        <ButtonsSample />
        <ChoicesSample />
        <FieldsSample />
        <OverlaysSample />
        <ChartSample className="xl:col-span-2" />
        <TableSample />
      </div>
    </div>
  )
}
