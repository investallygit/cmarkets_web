import { useQuery } from '@tanstack/react-query'
import { FlaskConical } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { apiClient } from '@/shared/api'
import type { AccountType, LoginRequestDto } from '@/shared/api/contracts'

interface DemoAccountsDto {
  password: string
  accounts: { accountType: AccountType; email: string; displayName: string }[]
}

/**
 * Prototype only: the demo user of each account type (GET /_prototype/accounts, not part of
 * CMarket.Api). A click fills in the form.
 */
export function DemoAccounts({ onPick }: { onPick: (credentials: LoginRequestDto) => void }) {
  const { t } = useTranslation()
  const demo = useQuery({
    queryKey: ['prototype', 'accounts'],
    queryFn: ({ signal }) =>
      apiClient.get<DemoAccountsDto>('/_prototype/accounts', { signal, anonymous: true }),
    staleTime: Infinity,
  })
  if (!demo.data) return null
  const { password, accounts } = demo.data

  return (
    <section
      aria-labelledby="demo-accounts"
      className="flex flex-col gap-1.5 border border-dashed border-warning/50 p-2"
    >
      <h2
        id="demo-accounts"
        className="flex items-center gap-1.5 font-sans text-data font-semibold text-warning"
      >
        <FlaskConical aria-hidden className="size-3.5" />
        {t('auth.prototype.accounts', { password })}
      </h2>
      <ul className="flex flex-col">
        {accounts.map((account) => (
          <li key={account.accountType}>
            <button
              type="button"
              onClick={() => onPick({ email: account.email, password })}
              className="grid min-h-6 w-full grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-2 px-1 text-left font-sans text-data hover:bg-panel-header"
            >
              <span className="text-secondary">{t(`accountTypes.${account.accountType}`)}</span>
              <span className="truncate font-mono">{account.email}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
