import { useTranslation } from 'react-i18next'
import { useCurrentUser, useUpdateProfileFields } from '@/entities/session'
import type { OtpChannel } from '@/shared/api/contracts'
import { SegmentedControl } from '@/shared/ui/form/SegmentedControl'

/**
 * Two-factor authentication (spec section 6): always on, the user only chooses where the login
 * codes go. SMS needs the phone number of the profile. The rest of the profile is sent as the
 * server holds it, not as this tab read it (B100).
 */
export function TwoFactorForm() {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const update = useUpdateProfileFields()
  const choose = (twoFactorChannel: OtpChannel) => {
    if (twoFactorChannel !== user.twoFactorChannel) update.mutate({ twoFactorChannel })
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-sans text-data text-secondary">{t('settings.security.twoFactor')}</span>
      <SegmentedControl
        value={
          update.isPending ? (update.variables?.twoFactorChannel ?? null) : user.twoFactorChannel
        }
        options={[
          { value: 'email', label: t('settings.security.channels.email') },
          { value: 'sms', label: t('settings.security.channels.sms'), disabled: !user.phone },
        ]}
        onChange={choose}
        disabled={update.isPending}
        aria-label={t('settings.security.twoFactor')}
      />
      <p className="font-sans text-title text-secondary">
        {user.twoFactorChannel === 'sms' && user.phone
          ? t('settings.security.codesBySms', { phone: user.phone })
          : t('settings.security.codesByEmail', { email: user.email })}
        {!user.phone && ` ${t('settings.security.smsNeedsPhone')}`}
      </p>
      {update.error && (
        <p role="alert" className="font-sans text-title text-down">
          {update.error.message}
        </p>
      )}
    </div>
  )
}
