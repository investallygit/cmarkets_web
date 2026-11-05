import { clsx } from 'clsx'
import { LoaderCircle, type LucideIcon } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router'

export type ButtonVariant =
  'primary' | 'secondary' | 'info' | 'success' | 'danger' | 'link' | 'brand'
/** xl: the calls to action of the home page. */
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

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
  xl: 'h-11 px-5 text-label',
}

const BASE = [
  'inline-flex shrink-0 items-center justify-center gap-1.5 font-sans whitespace-nowrap outline-none',
  'focus-visible:ring-1 focus-visible:ring-accent-amber focus-visible:ring-offset-1 focus-visible:ring-offset-app',
]

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
        BASE,
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

/** Links can be neither disabled nor busy: their variants have no `enabled:` state. */
const LINK_VARIANTS = {
  brand:
    'border border-brand-green bg-brand-green font-semibold tracking-title text-brand-navy uppercase hover:bg-brand-green/85',
  /** The other links of the home page, on the brand navy. */
  outline: 'border border-primary/30 text-primary hover:border-primary/60 hover:bg-primary/5',
  /** In the terminal, as the buttons of the same names. */
  primary:
    'border border-accent-amber bg-accent-amber font-semibold tracking-title text-app uppercase hover:bg-accent-amber/85',
  secondary: 'border text-primary hover:bg-panel-header',
  info: 'border text-info hover:bg-info/10',
}

interface ButtonLinkProps extends LinkProps {
  variant?: keyof typeof LINK_VARIANTS
  size?: ButtonSize
  icon?: LucideIcon
}

/** A link that looks like a button, for the calls to action that open a page: the icon follows. */
export function ButtonLink({
  variant = 'outline',
  size = 'md',
  icon: Icon,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link {...rest} className={clsx('group', BASE, LINK_VARIANTS[variant], SIZES[size], className)}>
      {children}
      {Icon && (
        <Icon
          aria-hidden
          className={clsx(
            'motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5',
            size === 'xl' ? 'size-4' : 'size-3.5',
          )}
        />
      )}
    </Link>
  )
}
