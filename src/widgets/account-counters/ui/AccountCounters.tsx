import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import { ACCOUNT_TYPE_COLORS, useAccountCounts } from '@/entities/account'
import { ACCOUNT_TYPES, type AccountType } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'

interface AccountCountersProps {
  /** The type the accounts are filtered on; a click on its counter clears it. */
  selected: AccountType | null
  onSelect: (type: AccountType | null) => void
}

/**
 * Screen 9, counters: the active accounts by type, each in the type's colour reused across the
 * screen (GET /admin/users/counts). A click filters the accounts on that type.
 */
export function AccountCounters({ selected, onSelect }: AccountCountersProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const counts = useAccountCounts()

  return (
    <div
      role="group"
      aria-label={t('accounts.counters')}
      // Two tiles a line on a phone, three from 640 px: a type's name and "active" whole (B29).
      className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-10"
    >
      {ACCOUNT_TYPES.map((type) => (
        <button
          key={type}
          type="button"
          aria-pressed={selected === type}
          onClick={() => onSelect(selected === type ? null : type)}
          className={clsx(
            'flex flex-col gap-0.5 border border-l-4 px-3 py-1.5 text-left hover:bg-panel-header',
            selected === type ? 'bg-selected' : 'bg-panel',
          )}
          style={{ borderLeftColor: ACCOUNT_TYPE_COLORS[type] }}
        >
          <span className="truncate font-sans text-title font-semibold tracking-title text-secondary uppercase">
            {t(`accountTypes.${type}`)}
          </span>
          <span className="flex flex-wrap items-baseline justify-between gap-x-2">
            <span className="font-mono text-figure font-semibold">
              {counts.data ? format.number(counts.data[type], 0) : '—'}
            </span>
            <span className="font-sans text-data text-secondary">{t('accounts.active')}</span>
          </span>
        </button>
      ))}
    </div>
  )
}
