import { useTranslation } from 'react-i18next'
import { VerifiedBadge } from '@/entities/account'
import {
  ABOUT_MAX_LENGTH,
  AccountTypeBadge,
  MAX_SPECIALTIES,
  PROFILE_COUNTRIES,
  ProfileAvatar,
} from '@/entities/profile'
import { useFormat } from '@/shared/i18n'
import { Field } from '@/shared/ui/form/Field'
import { Select } from '@/shared/ui/form/Select'
import { Textarea } from '@/shared/ui/form/Textarea'
import { TextInput } from '@/shared/ui/form/TextInput'
import type { ProfileEditor } from '../model/useProfileEditor'
import { ExperienceList } from './ExperienceList'
import { LanguagePicker } from './LanguagePicker'
import { PhotoButton } from './PhotoButton'
import { SpecialtyPicker } from './SpecialtyPicker'
import { SectionTitle } from './SectionTitle'

/**
 * NET ME, my profile (spec section 9, screen 12): the photo, the type and its badge, which
 * CMarket assigns, then what the user writes: name, job, organisation, place, languages, about,
 * specialties, experience and certifications, contact details.
 */
export function ProfileFields({ editor }: { editor: ProfileEditor }) {
  const { t } = useTranslation()
  const format = useFormat()
  const { form, set, profile } = editor
  const error = (field: keyof typeof form) => {
    const code = editor.errors[field]
    return code ? t(`network.profile.errors.${code}`) : editor.serverErrors[field]
  }
  const text = (field: 'displayName' | 'jobTitle' | 'organization' | 'city') => (
    <Field label={t(`network.profile.${field}`)} error={error(field)}>
      <TextInput value={form[field]} onChange={(value) => set({ [field]: value })} maxLength={80} />
    </Field>
  )
  const countries = PROFILE_COUNTRIES.includes(form.country)
    ? PROFILE_COUNTRIES
    : [form.country, ...PROFILE_COUNTRIES]

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-4">
        <ProfileAvatar
          name={form.displayName || profile.displayName}
          type={profile.accountType}
          photoUrl={profile.photoUrl}
          size="lg"
        />
        <div className="flex min-w-0 flex-col gap-2">
          <PhotoButton />
          <p className="flex flex-wrap items-center gap-2 font-sans text-data text-secondary">
            {t('network.profile.accountType')}
            <AccountTypeBadge type={profile.accountType} />
            {profile.verified && <VerifiedBadge />}
          </p>
          <p className="font-sans text-title text-secondary">{t('network.profile.typeNote')}</p>
        </div>
      </div>

      {text('displayName')}
      {text('jobTitle')}
      {text('organization')}
      <div className="grid grid-cols-2 gap-3">
        {text('city')}
        <Field label={t('network.profile.country')} error={error('country')}>
          <Select
            value={form.country}
            options={countries.map((code) => ({ value: code, label: format.country(code) }))}
            onChange={(country) => set({ country })}
          />
        </Field>
      </div>
      <Field label={t('network.profile.languages')} group error={error('languages')}>
        <LanguagePicker value={form.languages} onChange={(languages) => set({ languages })} />
      </Field>
      <Field
        label={t('network.profile.about', { max: ABOUT_MAX_LENGTH })}
        hint={t('network.profile.aboutCount', {
          count: form.about.length,
          max: ABOUT_MAX_LENGTH,
        })}
        error={error('about')}
      >
        <Textarea
          value={form.about}
          onChange={(about) => set({ about })}
          maxLength={ABOUT_MAX_LENGTH}
          rows={3}
        />
      </Field>
      <Field
        label={t('network.profile.specialties')}
        group
        hint={t('network.profile.specialtiesHint', { max: MAX_SPECIALTIES })}
        error={error('specialties')}
      >
        <SpecialtyPicker
          specialties={editor.specialties}
          value={form.specialties}
          onChange={(specialties) => set({ specialties })}
        />
      </Field>

      <section className="flex flex-col gap-1.5">
        <SectionTitle>{t('network.profile.experience')}</SectionTitle>
        <ExperienceList experiences={profile.experiences} />
      </section>

      <section className="flex flex-col gap-2">
        <SectionTitle>{t('network.profile.contact')}</SectionTitle>
        <p className="font-sans text-title text-secondary">{t('network.profile.contactHint')}</p>
        <Field label={t('network.profile.workEmail')} inline error={error('workEmail')}>
          <TextInput
            type="email"
            value={form.workEmail}
            onChange={(workEmail) => set({ workEmail })}
            autoComplete="email"
            mono
          />
        </Field>
        <Field label={t('network.profile.phone')} inline error={error('phone')}>
          <TextInput
            type="tel"
            value={form.phone}
            onChange={(phone) => set({ phone })}
            autoComplete="tel"
            mono
          />
        </Field>
        <Field label={t('network.profile.linkedIn')} inline error={error('linkedIn')}>
          <TextInput
            value={form.linkedIn}
            onChange={(linkedIn) => set({ linkedIn })}
            placeholder="linkedin.com/in/…"
            mono
          />
        </Field>
      </section>
    </div>
  )
}
