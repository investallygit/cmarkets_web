import type { RfqCompletionDto } from '@/shared/api/contracts'
import type { BadgeTone } from '@/shared/ui/Badge'

/**
 * A ratio's colour (spec, screen 22, sixth version; ROADMAP decision 52): green from 90%, amber
 * from 75 to 90%, red below; a newcomer's "New (n)" neutral.
 */
export function completionTone(completion: RfqCompletionDto): BadgeTone {
  if (completion.percent === null) return 'neutral'
  if (completion.percent >= 90) return 'up'
  return completion.percent >= 75 ? 'warning' : 'down'
}

/** The text colour of a tone, as the mockup writes the ratios ("96% (48)" in green). */
export const COMPLETION_TEXT: Readonly<Record<BadgeTone, string>> = {
  neutral: 'text-secondary',
  info: 'text-info',
  amber: 'text-accent-amber',
  warning: 'text-warning',
  up: 'text-up',
  down: 'text-down',
}

/** How a ratio reads in the user's language: "96% (48)" or "96 % (48)", "New (3)". */
export interface CompletionLabels {
  percent: (percent: number) => string
  withCases: (percent: number, cases: number) => string
  newcomer: (cases: number) => string
}

/** "96% (48)", the percent and the cases; "96%" without them (the board's requester column); under 5 cases, "New (3)". */
export function formatCompletion(
  completion: RfqCompletionDto,
  labels: CompletionLabels,
  withCases = true,
): string {
  if (completion.percent === null) return labels.newcomer(completion.cases)
  return withCases
    ? labels.withCases(completion.percent, completion.cases)
    : labels.percent(completion.percent)
}
