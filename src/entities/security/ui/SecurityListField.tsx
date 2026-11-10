import { X } from 'lucide-react'
import { SecurityPicker } from './SecurityPicker'

interface SecurityListFieldProps {
  value: readonly string[]
  onChange: (securityIds: string[]) => void
  /** The picker's label: "Add a security". */
  addLabel: string
  /** The label of a chip's button: "Remove SEMC". */
  removeLabel: (code: string) => string
  /** No picker once the list holds this many. */
  max?: number
  disabled?: boolean
}

/** The securities an item concerns, in order: chips, and a picker to add one (NEWS, the studio). */
export function SecurityListField({
  value,
  onChange,
  addLabel,
  removeLabel,
  max,
  disabled = false,
}: SecurityListFieldProps) {
  const full = max !== undefined && value.length >= max
  return (
    <div className="grid gap-1.5">
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((id) => (
            <li
              key={id}
              className="inline-flex h-6 items-center gap-1 border border-accent-amber/50 pr-1 pl-2 font-mono text-data text-accent-amber"
            >
              {id}
              {!disabled && (
                <button
                  type="button"
                  aria-label={removeLabel(id)}
                  className="inline-flex size-6 items-center justify-center text-secondary hover:text-primary"
                  onClick={() => onChange(value.filter((candidate) => candidate !== id))}
                >
                  <X aria-hidden className="size-3" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {!disabled && !full && (
        <SecurityPicker
          onSelect={(security) => onChange([...value, security.id])}
          exclude={new Set(value)}
          placeholder={addLabel}
          aria-label={addLabel}
        />
      )}
    </div>
  )
}
