import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useBlocker } from 'react-router'
import { ConfirmDialog } from './ConfirmDialog'

/**
 * Changes not saved are not dropped unasked (B68): while `dirty`, closing or reloading the tab asks
 * the browser's question, and leaving the screen in the app asks whether to leave without saving.
 * The router's blocker exists only while there is something to lose: an idle one still heard every
 * history change made outside the router, and warned of each in the console.
 */
export function LeaveGuard({ dirty }: { dirty: boolean }) {
  return dirty ? <UnsavedGuard /> : null
}

function UnsavedGuard() {
  const { t } = useTranslation()
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => currentLocation.pathname !== nextLocation.pathname,
  )

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [])

  return (
    <ConfirmDialog
      open={blocker.state === 'blocked'}
      onClose={() => blocker.reset?.()}
      title={t('leave.title')}
      message={t('leave.message')}
      confirmLabel={t('leave.confirm')}
      tone="danger"
      onConfirm={() => blocker.proceed?.()}
    />
  )
}
