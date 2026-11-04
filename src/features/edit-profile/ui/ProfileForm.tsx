import { CircleCheck } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { VerifiedBadge } from '@/entities/account'
import { profileOf, useCurrentUser, useUpdateProfile } from '@/entities/session'
import { isApiError } from '@/shared/api'
import type { MeUpdateDto, UserLanguage } from '@/shared/api/contracts'
import { TIME_ZONES } from '@/shared/config/timeZones'
import { formatUtcOffset } from '@/shared/lib/format'
import { isPhoneNumber } from '@/shared/lib/phone'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { SegmentedControl } from '@/shared/ui/form/SegmentedControl'
import { Select } from '@/shared/ui/form/Select'
import { TextInput } from '@/shared/ui/form/TextInput'

const LANGUAGE_NAMES: Record<UserLanguage, string> = { fr: 'Français', en: 'English' }

/** "Douala (UTC+01:00)": the city of an IANA zone and its offset today. */
function timeZoneLabel(timeZone: string): string {
  const city = timeZone.split('/').at(-1)?.replace(/_/g, ' ') ?? timeZone
  return `${city} (${formatUtcOffset(timeZone)})`
}

/**
 * The profile of CFG (PUT /me): name, phone for SMS alerts and codes, language and time zone,
 * which apply at once. The e-mail address is the login and stays as it is.
 */
export function ProfileForm() {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const update = useUpdateProfile()
  const [form, setForm] = useState<MeUpdateDto>(() => profileOf(user))
  const [submitted, setSubmitted] = useState(false)
  const set = (patch: Partial<MeUpdateDto>) => {
    update.reset()
    setForm((current) => ({ ...current, ...patch }))
  }

  const phone = form.phone?.trim() ?? ''
  const nameMissing = submitted && !form.displayName.trim()
  const phoneInvalid = submitted && phone !== '' && !isPhoneNumber(phone)
  const serverErrors = isApiError(update.error, 400) ? (update.error.problem.errors ?? {}) : {}
  const zones: readonly string[] = TIME_ZONES.some((zone) => zone === form.timeZone)
    ? TIME_ZONES
    : [form.timeZone, ...TIME_ZONES]
  const changed = JSON.stringify(form) !== JSON.stringify(profileOf(user))

  return (
    <form
      noValidate
      className="flex flex-col gap-3 p-3"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (!form.displayName.trim() || (phone && !isPhoneNumber(phone))) return
        update.mutate({ ...form, displayName: form.displayName.trim(), phone: phone || null })
      }}
    >
      <dl className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-x-3 gap-y-1 font-sans text-data">
        <dt className="text-secondary">{t('settings.profile.email')}</dt>
        <dd className="truncate font-mono">{user.email}</dd>
        <dt className="text-secondary">{t('settings.profile.accountType')}</dt>
        <dd>
          {t(`accountTypes.${user.accountType}`)}
          {user.verificationStatus === 'approved' && (
            <>
              {' '}
              <VerifiedBadge />
            </>
          )}
          {(user.verificationStatus === 'pending' || user.verificationStatus === 'rejected') &&
            ` · ${t(`settings.profile.verificationStatus.${user.verificationStatus}`)}`}
        </dd>
        <dt className="text-secondary">{t('settings.profile.organization')}</dt>
        <dd className="truncate">{user.organization?.name ?? t('settings.profile.individual')}</dd>
      </dl>
      <Field
        label={t('settings.profile.name')}
        error={nameMissing ? t('auth.signUp.errors.required') : serverErrors.displayName?.[0]}
      >
        <TextInput
          value={form.displayName}
          onChange={(displayName) => set({ displayName })}
          autoComplete="name"
          highlight
        />
      </Field>
      <Field
        label={t('settings.profile.phone')}
        hint={t('settings.profile.phoneHint')}
        error={phoneInvalid ? t('auth.signUp.errors.phone') : serverErrors.phone?.[0]}
      >
        <TextInput
          type="tel"
          value={form.phone ?? ''}
          onChange={(value) => set({ phone: value })}
          autoComplete="tel"
          placeholder="+237 6 70 12 34 56"
          highlight
          mono
        />
      </Field>
      <Field label={t('settings.profile.language')} group>
        <SegmentedControl
          value={form.language}
          options={(['fr', 'en'] as const).map((language) => ({
            value: language,
            label: LANGUAGE_NAMES[language],
          }))}
          onChange={(language) => set({ language })}
          aria-label={t('settings.profile.language')}
        />
      </Field>
      <Field
        label={t('settings.profile.timeZone')}
        hint={t('settings.profile.timeZoneHint')}
        error={serverErrors.timeZone?.[0]}
      >
        <Select
          value={form.timeZone}
          options={zones.map((zone) => ({ value: zone, label: timeZoneLabel(zone) }))}
          onChange={(timeZone) => set({ timeZone })}
          highlight
        />
      </Field>
      {update.error && !isApiError(update.error, 400) && (
        <p role="alert" className="font-sans text-data text-down">
          {update.error.message}
        </p>
      )}
      <div className="flex items-center justify-end gap-3">
        {update.isSuccess && !changed && (
          <span
            role="status"
            className="inline-flex items-center gap-1 font-sans text-data text-up"
          >
            <CircleCheck aria-hidden className="size-3.5" />
            {t('settings.saved')}
          </span>
        )}
        <Button type="submit" variant="primary" busy={update.isPending} disabled={!changed}>
          {t('common.save')}
        </Button>
      </div>
    </form>
  )
}
