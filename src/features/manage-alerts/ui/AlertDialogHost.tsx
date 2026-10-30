import { useAlertDialog } from '@/entities/alert'
import { AlertDialog } from './AlertDialog'

/** The alert form asked for from anywhere (openAlertDialog). Mounted once, by the app shell. */
export function AlertDialogHost() {
  const request = useAlertDialog((state) => state.request)
  const close = useAlertDialog((state) => state.close)
  return <AlertDialog request={request} onClose={close} />
}
