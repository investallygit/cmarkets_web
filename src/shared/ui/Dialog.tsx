import { clsx } from 'clsx'
import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

/** First control of the dialog content to focus on opening; the close button comes last. */
const FOCUSABLE =
  'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'

interface DialogProps {
  open: boolean
  /** Escape, the close button and the browser all close through this callback. */
  onClose: () => void
  title: ReactNode
  /** Usually a <DialogBody> then a <DialogFooter>, inside a <form className="contents">. */
  children: ReactNode
  /** right: a side form, as "New transaction" on the portfolio screen. */
  placement?: 'center' | 'right'
  /** Width in px, capped by the window. */
  width?: number
}

/**
 * Modal dialog on the native <dialog>: focus stays inside, Escape closes, the rest of the page is
 * inert. The content is mounted only while open, so a form starts empty each time. It is rendered
 * in <body>, so a dialog opened from a panel title bar neither inherits its upper-case text nor
 * sits inside its drag handle.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  placement = 'center',
  width = placement === 'right' ? 400 : 440,
}: DialogProps) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      openerRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null
      dialog.showModal()
      contentRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  // The browser gives the focus back to the opener on close() only. A dialog shown while some
  // state holds ({deleting && <ConfirmDialog open />}) leaves the page open, the focus with it:
  // give the focus back, unless the action moved it or took the opener away. A dialog closed
  // first has nothing to give back: its opener is forgotten on closing (onClose below).
  useEffect(
    () => () => {
      const opener = openerRef.current
      if (opener?.isConnected && document.activeElement === document.body) opener.focus()
    },
    [],
  )

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      // The browser may close the dialog itself, e.g. on a second Escape.
      onClose={() => {
        openerRef.current = null
        if (open) onClose()
      }}
      style={{ width: `min(${width}px, calc(100vw - 32px))` }}
      className={clsx(
        'flex-col border bg-panel p-0 text-primary open:flex backdrop:bg-[rgb(0_0_0/0.7)]',
        placement === 'right' ? 'my-0 mr-0 ml-auto h-full max-h-full' : 'm-auto max-h-[85vh]',
      )}
    >
      {open && (
        <>
          <header className="flex h-bar shrink-0 items-center border-b bg-panel-header pr-8 pl-2">
            <h2
              id={titleId}
              className="truncate font-sans text-title font-semibold tracking-title text-accent-amber uppercase"
            >
              {title}
            </h2>
          </header>
          <div ref={contentRef} className="flex min-h-0 flex-1 flex-col">
            {children}
          </div>
          <button
            type="button"
            aria-label={t('common.close')}
            onClick={onClose}
            className="absolute top-0 right-1 inline-flex size-6 items-center justify-center text-secondary hover:text-primary"
          >
            <X aria-hidden className="size-3.5" />
          </button>
        </>
      )}
    </dialog>,
    document.body,
  )
}

export function DialogBody({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={clsx('flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-3', className)}>
      {children}
    </div>
  )
}

export function DialogFooter({ children }: { children: ReactNode }) {
  return <div className="flex shrink-0 justify-end gap-2 border-t px-3 py-2">{children}</div>
}
