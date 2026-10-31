import { clsx } from 'clsx'
import { Search, X } from 'lucide-react'
import { useId, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { AdminUserDto } from '@/shared/api/contracts'
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue'
import { TextInput } from '@/shared/ui/form/TextInput'
import { useAccounts } from '../api/queries'
import { AccountTypeText } from './AccountTypeText'

const SUGGESTIONS = 8

interface AccountPickerProps {
  /** Shown while nothing is typed: the name of the chosen account. */
  value: string | null
  onSelect: (account: AdminUserDto) => void
  onClear: () => void
  'aria-label'?: string
  className?: string
}

/**
 * Search box over the accounts (GET /admin/users?q=): a name, an e-mail address or an
 * organisation, picked with the arrow keys and Enter or with the mouse.
 */
export function AccountPicker({
  value,
  onSelect,
  onClear,
  'aria-label': ariaLabel,
  className,
}: AccountPickerProps) {
  const { t } = useTranslation()
  const listId = useId()
  /** Text being typed; null shows `value`. */
  const [draft, setDraft] = useState<string | null>(null)
  const [active, setActive] = useState(0)
  const q = useDebouncedValue(draft?.trim() ?? '', 200)
  const search = useAccounts({ q, sort: 'name', pageSize: SUGGESTIONS }, q !== '')

  const suggestions = draft?.trim() && q ? (search.data?.items ?? []) : []
  const open = suggestions.length > 0
  const activeIndex = Math.min(active, suggestions.length - 1)

  const choose = (account: AdminUserDto) => {
    setDraft(null)
    setActive(0)
    onSelect(account)
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
    } else if (event.key === 'Escape' && draft) {
      event.preventDefault()
      setDraft(null)
    }
  }

  return (
    <div className={clsx('relative', className)}>
      <TextInput
        icon={Search}
        value={draft ?? value ?? ''}
        onChange={(text) => {
          setDraft(text)
          setActive(0)
        }}
        onBlur={() => setDraft(null)}
        onKeyDown={onKeyDown}
        placeholder={t('accounts.pickerPlaceholder')}
        aria-label={ariaLabel}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${activeIndex}` : undefined}
        trailing={
          value &&
          draft === null && (
            <button
              type="button"
              aria-label={t('accounts.clearPicker')}
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
        {suggestions.map((account, index) => (
          <li
            key={account.id}
            id={`${listId}-${index}`}
            role="option"
            aria-selected={index === activeIndex}
            // Keeps the focus in the box, which would otherwise blur and close the list first.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => choose(account)}
            onMouseEnter={() => setActive(index)}
            className={clsx(
              'flex cursor-pointer items-baseline gap-2 px-2 py-0.5 font-sans text-data',
              index === activeIndex && 'bg-selected',
            )}
          >
            <span className="shrink-0">{account.displayName}</span>
            <AccountTypeText type={account.accountType} short />
            <span className="truncate text-secondary">{account.email}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
