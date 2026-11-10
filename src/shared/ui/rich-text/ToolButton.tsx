import { clsx } from 'clsx'
import type { ReactNode } from 'react'

interface ToolButtonProps {
  label: ReactNode
  /** Spoken and shown on hover when the label is a symbol. */
  title: string
  active?: boolean
  disabled: boolean
  onClick: () => void
  className?: string
}

/** A button of a rich-text toolbar: B, I, H2, List, Table… pressed while its mark is on. */
export function ToolButton({
  label,
  title,
  active = false,
  disabled,
  onClick,
  className,
}: ToolButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      // The selection stays in the text while a button is pressed.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={clsx(
        'h-7 px-2 font-sans text-data disabled:opacity-40',
        active ? 'text-accent-amber' : 'hover:text-accent-amber',
        className,
      )}
    >
      {label}
    </button>
  )
}
