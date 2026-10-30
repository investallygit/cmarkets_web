import { clsx } from 'clsx'
import { useId, useMemo, type ReactNode } from 'react'
import { FieldContext } from './fieldContext'

interface FieldProps {
  label: ReactNode
  /** Help shown under the control, e.g. "Range: XAF 2,000 to 100,000". */
  hint?: ReactNode
  error?: ReactNode
  /** Label on the left and control on the right, as in the bond calculator. */
  inline?: boolean
  /** The control is a group (radio buttons): the label names it instead of targeting it. */
  group?: boolean
  className?: string
  children: ReactNode
}

/** Label, control, hint and error, wired together for screen readers. */
export function Field({
  label,
  hint,
  error,
  inline = false,
  group = false,
  className,
  children,
}: FieldProps) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const context = useMemo(
    () => ({
      controlId: `${id}-control`,
      labelId: `${id}-label`,
      describedBy: [errorId, hintId].filter(Boolean).join(' ') || undefined,
      invalid: Boolean(error),
    }),
    [id, hintId, errorId, error],
  )
  const labelClassName = 'font-sans text-data text-secondary'
  const noteClassName = clsx('font-sans text-title', inline && 'col-start-2')

  return (
    <div
      className={clsx(
        inline
          ? 'grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] items-center gap-x-3 gap-y-1'
          : 'flex flex-col gap-1',
        className,
      )}
    >
      {group ? (
        <span id={context.labelId} className={labelClassName}>
          {label}
        </span>
      ) : (
        <label id={context.labelId} htmlFor={context.controlId} className={labelClassName}>
          {label}
        </label>
      )}
      <FieldContext.Provider value={context}>{children}</FieldContext.Provider>
      {hint && (
        <p id={hintId} className={clsx(noteClassName, 'text-secondary')}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={clsx(noteClassName, 'text-down')}>
          {error}
        </p>
      )}
    </div>
  )
}
