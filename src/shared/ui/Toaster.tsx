import { clsx } from 'clsx'
import { CircleCheck, Info, TriangleAlert, X, type LucideIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useToastStore, type ToastMessage, type ToastTone } from './toast'

const DURATION_MS: Record<ToastTone, number> = { info: 5000, success: 5000, error: 8000 }
const ICONS: Record<ToastTone, LucideIcon> = {
  info: Info,
  success: CircleCheck,
  error: TriangleAlert,
}
const ICON_COLORS: Record<ToastTone, string> = {
  info: 'text-info',
  success: 'text-up',
  error: 'text-down',
}

/** Messages of toast(), above the status bar. Mounted once, by the app shell. */
export function Toaster() {
  const toasts = useToastStore((state) => state.toasts)
  const stackRef = useRef<HTMLDivElement>(null)

  // As a popover the stack sits in the top layer, so it stays visible above a modal dialog.
  // Showing it again brings it above a dialog opened since.
  useEffect(() => {
    const stack = stackRef.current
    if (!stack || typeof stack.showPopover !== 'function') return
    if (!stack.hasAttribute('popover')) stack.setAttribute('popover', 'manual')
    if (stack.matches(':popover-open')) stack.hidePopover()
    if (toasts.length > 0) stack.showPopover()
  }, [toasts])

  return (
    <div
      ref={stackRef}
      className="fixed top-auto right-2 bottom-7.5 left-auto z-50 m-0 flex w-80 flex-col gap-1.5 overflow-visible border-0 bg-transparent p-0 text-primary"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  )
}

function Toast({ toast }: { toast: ToastMessage }) {
  const { t } = useTranslation()
  const dismiss = useToastStore((state) => state.dismiss)
  const Icon = ICONS[toast.tone]

  useEffect(() => {
    const timer = window.setTimeout(() => dismiss(toast.id), DURATION_MS[toast.tone])
    return () => window.clearTimeout(timer)
  }, [dismiss, toast.id, toast.tone])

  return (
    <div
      role={toast.tone === 'error' ? 'alert' : 'status'}
      className="flex items-start gap-2 border bg-panel-header px-3 py-2 font-sans text-data shadow-lg"
    >
      <Icon aria-hidden className={clsx('mt-px size-3.5 shrink-0', ICON_COLORS[toast.tone])} />
      <span className="min-w-0 flex-1">{toast.message}</span>
      <button
        type="button"
        aria-label={t('common.close')}
        onClick={() => dismiss(toast.id)}
        className="shrink-0 text-secondary hover:text-primary"
      >
        <X aria-hidden className="size-3.5" />
      </button>
    </div>
  )
}
