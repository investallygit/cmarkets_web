import { create } from 'zustand'
import type { AlertDto } from '@/shared/api/contracts'

/** An alert to edit, or a new one, possibly on a given security. */
export type AlertDialogRequest = { alert: AlertDto } | { alert?: undefined; securityId?: string }

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
