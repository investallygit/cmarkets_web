import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import type { ContactMode } from '@/shared/api/contracts'
import { Button } from '@/shared/ui/form/Button'

const LABELS = {
  direct: 'network.card.contact',
  request: 'network.card.request',
  none: 'network.card.closed',
} as const

/** The look of each button, for the preview that shows it without acting. */
const LOOKS: Record<ContactMode, string> = {
  direct: 'border-accent-amber bg-accent-amber font-semibold tracking-title text-app uppercase',
  request: 'text-primary',
  none: 'text-secondary',
}

interface ContactButtonProps {
  mode: ContactMode
  onContact?: () => void
  /** The card as others see it (NET ME): the button shows, and does nothing. */
  preview?: boolean
  className?: string
}

/**
 * The button of a card, by the recipient's rule for the viewer (spec section 15): amber
 * "Contact", "Send a contact request", or a greyed "Contact not open".
 */
export function ContactButton({ mode, onContact, preview = false, className }: ContactButtonProps) {
  const { t } = useTranslation()
  const label = t(LABELS[mode])
  if (preview) {
    return (
      <span
        className={clsx(
          'inline-flex h-8.5 items-center justify-center border px-4 font-sans text-label',
          LOOKS[mode],
          className,
        )}
      >
        {label}
      </span>
    )
  }
  return (
    <Button
      size="lg"
      variant={mode === 'direct' ? 'primary' : 'secondary'}
      disabled={mode === 'none'}
      onClick={onContact}
      className={className}
    >
      {label}
    </Button>
  )
}
