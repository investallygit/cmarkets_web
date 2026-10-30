import { clsx } from 'clsx'
import type { ReactNode } from 'react'

interface InputFrameProps {
  /** Amber border: a value the user is expected to edit, e.g. the bond calculator inputs. */
  highlight?: boolean
  invalid?: boolean
  disabled?: boolean
  className?: string
  children: ReactNode
}

/** Border, background and focus ring shared by the single-line controls (28 px high). */
export function InputFrame({ highlight, invalid, disabled, className, children }: InputFrameProps) {
  return (
    <div
      className={clsx(
        'relative flex h-7 min-w-0 items-center gap-1.5 border bg-app px-2',
        'has-focus-visible:ring-1 has-focus-visible:ring-accent-amber/40',
        invalid
          ? 'border-down'
          : clsx(highlight && 'border-accent-amber', 'has-focus-visible:border-accent-amber'),
        disabled && 'opacity-50',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Classes of the <input> or <select> inside an InputFrame. */
export const FRAMED_CONTROL =
  'h-full min-w-0 flex-1 bg-transparent text-data text-primary outline-none placeholder:text-secondary disabled:cursor-not-allowed'
