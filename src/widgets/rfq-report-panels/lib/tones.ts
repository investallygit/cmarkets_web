import type { BadgeTone } from '@/shared/ui/Badge'

/** A status in coloured text, as the mockup's list writes "Sent 18:00" in green. */
export const TONE_TEXT: Readonly<Record<BadgeTone, string>> = {
  neutral: 'text-secondary',
  info: 'text-info',
  amber: 'text-accent-amber',
  warning: 'text-warning',
  up: 'text-up',
  down: 'text-down',
}
