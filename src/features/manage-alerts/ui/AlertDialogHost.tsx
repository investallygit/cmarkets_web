import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import { useAlertDialog } from '@/entities/alert'
import { AlertDialog } from './AlertDialog'

/** The alert form asked for from anywhere (openAlertDialog). Mounted once, by the app shell. */
export function AlertDialogHost() {
  const request = useAlertDialog((state) => state.request)
  const close = useAlertDialog((state) => state.close)
  // The alert form, mounted by the app shell, closes when the screen changes: Back from ALRT left it
  // open over MKT (B47).
  const { pathname } = useLocation()
  const shown = useRef(pathname)
  useEffect(() => {
    if (pathname === shown.current) return
    shown.current = pathname
    close()
  }, [pathname, close])
  return <AlertDialog request={request} onClose={close} />
}
