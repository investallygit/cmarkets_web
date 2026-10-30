import type { AlertSeverity } from '@/shared/api/contracts'

/** Colour by severity (spec section 9): blue information, yellow warning, red critical. */
export const SEVERITY_TEXT: Record<AlertSeverity, string> = {
  info: 'text-info',
  warning: 'text-warning',
  critical: 'text-down',
}
