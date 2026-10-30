import { clsx } from 'clsx'
import { Search, X } from 'lucide-react'
import { useId, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { SecuritySearchItemDto, SecurityType } from '@/shared/api/contracts'
import { TextInput } from '@/shared/ui/form/TextInput'
import { useSecuritySearch } from '../api/queries'

interface SecurityPickerProps {
  /** Shown while nothing is typed: the code of the chosen security. */
  value?: string | null
  onSelect: (security: SecuritySearchItemDto) => void
  /** Shows a button that clears the choice. */
  onClear?: () => void
  placeholder?: string
  /** Securities not offered, e.g. those already in the list. */
  exclude?: ReadonlySet<string>
  types?: readonly SecurityType[]
  /** Escape on an empty box, e.g. to close the "+ Add" row. */
  onEscape?: () => void
  autoFocus?: boolean
  highlight?: boolean
  'aria-label'?: string
  className?: string
}

/**
 * Search box with suggestions from GET /search: type a code or a name, pick with the arrow keys
 * and Enter or with the mouse. The suggestion list follows the ARIA combobox pattern.
 */
export function SecurityPicker({
  value,
  onSelect,
  onClear,
  placeholder,
  exclude,
  types,
  onEscape,
  autoFocus,
  highlight,
  'aria-label': ariaLabel,
  className,
}: SecurityPickerProps) {
  const { t } = useTranslation()
  const listId = useId()
  /** Text being typed; null shows `value`. */
  const [draft, setDraft] = useState<string | null>(null)
  const [active, setActive] = useState(0)
  const search = useSecuritySearch(draft ?? '')

  const suggestions =
    draft?.trim() && search.data
      ? search.data.securities.filter(
          (security) => !exclude?.has(security.id) && (!types || types.includes(security.type)),
        )
      : []
  const open = suggestions.length > 0
  const activeIndex = Math.min(active, suggestions.length - 1)

  const choose = (security: SecuritySearchItemDto) => {
    setDraft(null)
    setActive(0)
    onSelect(security)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' && open) {
      event.preventDefault()
      setActive((activeIndex + 1) % suggestions.length)
    } else if (event.key === 'ArrowUp' && open) {
      event.preventDefault()
      setActive((activeIndex - 1 + suggestions.length) % suggestions.length)
    } else if (event.key === 'Enter' && open) {
      event.preventDefault()
      choose(suggestions[activeIndex])
    } else if (event.key === 'Escape' && (draft || onEscape)) {
      // Clears the text without closing an enclosing dialog.
      event.preventDefault()
      if (draft) setDraft(null)
      else onEscape?.()
    }
  }

  return (
    <div className={clsx('relative', className)}>
      <TextInput
        mono
        icon={Search}
        value={draft ?? value ?? ''}
        onChange={(text) => {
          setDraft(text)
          setActive(0)
        }}
        onBlur={() => setDraft(null)}
        onKeyDown={onKeyDown}
        placeholder={placeholder ?? t('securityPicker.placeholder')}
        aria-label={ariaLabel}
        autoFocus={autoFocus}
        highlight={highlight}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${activeIndex}` : undefined}
        trailing={
          value &&
          onClear &&
          draft === null && (
            <button
              type="button"
              aria-label={t('securityPicker.clear')}
              onClick={onClear}
              className="shrink-0 text-secondary hover:text-primary"
            >
              <X aria-hidden className="size-3.5" />
            </button>
          )
        }
      />
      <ul
        id={listId}
        role="listbox"
        hidden={!open}
        className="absolute inset-x-0 top-full z-30 mt-px max-h-60 overflow-auto border bg-panel-header py-1 shadow-lg"
      >
        {suggestions.map((security, index) => (
          <li
            key={security.id}
            id={`${listId}-${index}`}
            role="option"
            aria-selected={index === activeIndex}
            // Keeps the focus in the box, which would otherwise blur and close the list first.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => choose(security)}
            onMouseEnter={() => setActive(index)}
            className={clsx(
              'flex cursor-pointer items-baseline gap-2 px-2 py-0.5',
              index === activeIndex && 'bg-selected',
            )}
          >
            <span className="shrink-0 font-mono text-data text-accent-amber">{security.code}</span>
            <span className="truncate font-sans text-data text-secondary">{security.name}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
