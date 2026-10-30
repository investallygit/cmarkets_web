import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLogout } from '@/entities/session'
import { lastActivityAt, recordActivity, trackActivity } from '@/shared/lib/activity'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { inactivityState } from '../lib/inactivity'

/**
 * Automatic logout after inactivity (spec section 6). An action in any tab of the browser counts;
 * a warning gives the last minute to stay. Mounted once by the app shell.
 */
export function InactivityLogout() {
  const { t } = useTranslation()
  const { mutate: logout } = useLogout()
  const [remainingMs, setRemainingMs] = useState<number | null>(null)
  const loggingOut = useRef(false)

  useEffect(() => trackActivity(), [])

  useEffect(() => {
    const check = () => {
      const state = inactivityState(Date.now() - lastActivityAt())
      if (state.phase === 'expired' && !loggingOut.current) {
        loggingOut.current = true
        logout('inactivity')
      }
      setRemainingMs(state.phase === 'warning' ? state.remainingMs : null)
    }
    const timer = window.setInterval(check, 1000)
    // A tab in the background is checked again as soon as it shows.
    document.addEventListener('visibilitychange', check)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', check)
    }
  }, [logout])

  const stay = () => {
    recordActivity()
    setRemainingMs(null)
  }

  return (
    <Dialog open={remainingMs !== null} onClose={stay} title={t('session.inactivity.title')}>
      <DialogBody>
        <p role="alert" className="font-sans text-label">
          {t('session.inactivity.warning', { count: Math.ceil((remainingMs ?? 0) / 1000) })}
        </p>
      </DialogBody>
      <DialogFooter>
        <Button onClick={() => logout('logout')}>{t('session.logout')}</Button>
        <Button variant="primary" onClick={stay}>
          {t('session.inactivity.stay')}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
