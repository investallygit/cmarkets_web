import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useBlocker } from 'react-router'
import { ConfirmDialog } from './ConfirmDialog'

/**
 * Changes not saved are not dropped unasked (B68): while `dirty`, closing or reloading the tab asks
 * the browser's question, and leaving the screen in the app asks whether to leave without saving.
 */
export function LeaveGuard({ dirty }: { dirty: boolean }) {
  const { t } = useTranslation()
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && currentLocation.pathname !== nextLocation.pathname,
  )

  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

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
