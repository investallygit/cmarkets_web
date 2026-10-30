import { clsx } from 'clsx'
import { LoaderCircle, type LucideIcon } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'

export type ButtonVariant =
  'primary' | 'secondary' | 'info' | 'success' | 'danger' | 'link' | 'brand'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * primary: the main action, amber (Run, Publish, Buy); secondary: other actions; info: links
   * shown as buttons (Download file templates); success / danger: Approve / Reject, Suspend;
   * brand: the main action of the login pages, in the brand green (spec section 8).
   */
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: LucideIcon
  /** Waiting for the server: shows a spinner and blocks a second click. */
  busy?: boolean
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'border border-accent-amber bg-accent-amber font-semibold tracking-title text-app uppercase enabled:hover:bg-accent-amber/85 disabled:opacity-40',
  secondary: 'border text-primary enabled:hover:bg-panel-header disabled:text-secondary',
  info: 'border text-info enabled:hover:bg-info/10 disabled:opacity-50',
  success: 'border border-up/70 font-semibold text-up enabled:hover:bg-up/10 disabled:opacity-50',
  danger: 'border border-down/70 text-down enabled:hover:bg-down/10 disabled:opacity-50',
  link: 'text-info enabled:hover:underline disabled:text-secondary',
  brand:
    'border border-brand-green bg-brand-green font-semibold tracking-title text-brand-navy uppercase enabled:hover:bg-brand-green/85 disabled:opacity-40',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-6 px-2 text-data',
  md: 'h-7 px-3 text-data',
  lg: 'h-8.5 px-4 text-label',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  busy = false,
  type = 'button',
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={clsx(
        'inline-flex shrink-0 items-center justify-center gap-1.5 font-sans whitespace-nowrap outline-none',
        'focus-visible:ring-1 focus-visible:ring-accent-amber focus-visible:ring-offset-1 focus-visible:ring-offset-app',
        VARIANTS[variant],
        variant === 'link' ? 'text-data' : SIZES[size],
        className,
      )}
    >
      {busy ? (
        <LoaderCircle aria-hidden className="size-3.5 animate-spin" />
      ) : (
        Icon && <Icon aria-hidden className="size-3.5" />
      )}
      {children}
    </button>
  )
}
