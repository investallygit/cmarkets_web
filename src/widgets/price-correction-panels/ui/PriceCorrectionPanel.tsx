import { useTranslation } from 'react-i18next'
import { priceDecimals } from '@/entities/quote'
import { SecurityPicker, useSecurityProfile } from '@/entities/security'
import { useStoredPrices } from '@/entities/stored-price'
import { PriceCorrectionForm } from '@/features/correct-price'
import { DateInput } from '@/shared/ui/form/DateInput'
import { Field } from '@/shared/ui/form/Field'
import { Panel } from '@/shared/ui/Panel'
import { PanelEmpty, PanelLoading } from '@/shared/ui/StatusViews'
import { useSourceText } from '../model/useSourceText'

interface PriceCorrectionPanelProps {
  securityId: string | null
  date: string | null
  onSecurityChange: (securityId: string) => void
  onDateChange: (date: string) => void
}

/**
 * CORR (spec sections 9 and 11): a security and a session, the stored open, high, low, close and
 * volume, and the correction with its reason.
 */
export function PriceCorrectionPanel({
  securityId,
  date,
  onSecurityChange,
  onDateChange,
}: PriceCorrectionPanelProps) {
  const { t } = useTranslation()
  const profile = useSecurityProfile(securityId ?? undefined)
  const stored = useStoredPrices(securityId, date ?? '', date ?? '')
  const sourceText = useSourceText()
  const session = date ? stored.data?.find((price) => price.date === date) : undefined
  const decimals = profile.data ? priceDecimals(profile.data.type, profile.data.currency) : 0

  return (
    <Panel title={t('panels.priceCorrection')} code="CORR" bodyClassName="flex flex-col">
      <div className="grid grid-cols-[minmax(0,1fr)_9rem] gap-3 border-b p-3">
        <Field label={t('corrections.security')}>
          <SecurityPicker
            value={profile.data?.code ?? securityId}
            onSelect={(security) => onSecurityChange(security.id)}
            placeholder={t('corrections.securityPlaceholder')}
            highlight={!securityId}
          />
        </Field>
        <Field label={t('corrections.session')}>
          <DateInput value={date} onChange={(value) => value && onDateChange(value)} highlight />
        </Field>
      </div>
      {!securityId || !date ? (
        <PanelEmpty message={t('corrections.pick')} />
      ) : stored.isPending || stored.isPlaceholderData || profile.isPending ? (
        <PanelLoading />
      ) : !session || !profile.data ? (
        <PanelEmpty message={t('corrections.noSession')} />
      ) : (
        <>
          <p className="px-3 pt-2 font-sans text-data text-secondary">
            {t('corrections.source', { source: sourceText(session) })}
          </p>
          <PriceCorrectionForm
            // Kept across its own correction, so the confirmation shows.
            key={`${profile.data.id}|${session.date}`}
            securityId={profile.data.id}
            code={profile.data.code}
            stored={session}
            decimals={decimals}
          />
        </>
      )}
    </Panel>
  )
}
