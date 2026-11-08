import { useQuery } from '@tanstack/react-query'
import { FlaskConical } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { apiClient } from '@/shared/api'
import { Button } from '@/shared/ui/form/Button'

interface PrototypeCodeProps {
  /** The login challenge, or the e-mail address of a password reset. */
  query: { challengeId: string } | { email: string; sentAt: number }
  onUse: (code: string) => void
}

/**
 * Prototype helper (env.devTools): the code the back end would have sent by e-mail or SMS shows
 * here (GET /_prototype/codes, from the mock or from CMarket.Api's development tools).
 */
export function PrototypeCode({ query, onUse }: PrototypeCodeProps) {
  const { t } = useTranslation()
  const sent = useQuery({
    queryKey: ['prototype', 'code', query],
    queryFn: ({ signal }) =>
      apiClient.get<{ code: string }>('/_prototype/codes', { query, signal, anonymous: true }),
    staleTime: Infinity,
  })
  const code = sent.data?.code
  if (!code) return null

  return (
    <p className="flex items-center gap-2 border border-dashed border-warning/50 px-2 py-1.5 font-sans text-data text-secondary">
      <FlaskConical aria-hidden className="size-3.5 shrink-0 text-warning" />
      {t('auth.prototype.code')}
      <span className="font-mono text-primary">{code}</span>
      <Button variant="link" onClick={() => onUse(code)} className="ml-auto">
        {t('auth.prototype.fill')}
      </Button>
    </p>
  )
}
