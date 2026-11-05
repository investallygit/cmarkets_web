import { clsx } from 'clsx'

/** The round mark of a radio button, amber once chosen; the native input stays for the keyboard. */
export function RadioMark({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={clsx(
        'flex size-4 shrink-0 items-center justify-center rounded-full border',
        'peer-focus-visible:ring-1 peer-focus-visible:ring-accent-amber peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-app',
        checked ? 'border-accent-amber' : 'border-secondary',
      )}
    >
      {checked && <span className="size-2 rounded-full bg-accent-amber" />}
    </span>
  )
}
