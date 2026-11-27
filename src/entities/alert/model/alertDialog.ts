import { create } from 'zustand'
import type { AlertDto, CalendarEventType } from '@/shared/api/contracts'

/** What a calendar alert opened from an event of CAL starts from: its type, its state or its security. */
export interface CalendarAlertSeed {
  event: CalendarEventType
  country: string | null
  securityId: string | null
  securityCode: string | null
}

/** An alert to edit, or a new one, possibly on a given security or on an event of the calendar. */
export type AlertDialogRequest =
  { alert: AlertDto } | { alert?: undefined; securityId?: string; calendar?: CalendarAlertSeed }

interface AlertDialogState {
  request: AlertDialogRequest | null
  close: () => void
}

/**
 * The alert form opened from anywhere: the ALRT screen, or "Create an alert" in the right-click
 * menu of a security. The app shell shows the form; this store only says what to show.
 */
export const useAlertDialog = create<AlertDialogState>()((set) => ({
  request: null,
  close: () => set({ request: null }),
}))

export function openAlertDialog(request: AlertDialogRequest = {}): void {
  useAlertDialog.setState({ request })
}
