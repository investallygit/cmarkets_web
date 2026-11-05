import { clsx } from 'clsx'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { CONTACT_MODES, PROFILE_VISIBILITIES } from '@/entities/profile'
import { CLIENT_ACCOUNT_TYPES, type ProfileDisplayDto } from '@/shared/api/contracts'
import { ACCOUNT_TYPE_COLORS } from '@/shared/config/accountTypes'
import { Switch } from '@/shared/ui/form/Switch'
import type { ProfileEditor } from '../model/useProfileEditor'
import { SectionTitle } from './SectionTitle'

/** The round mark of a radio button, amber once chosen; the native input stays for the keyboard. */
function RadioMark({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={clsx(
        'flex size-4 shrink-0 items-center justify-center rounded-full border',
        'peer-focus-visible:ring-1 peer-focus-visible:ring-accent-amber peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-app',
        checked ? 'border-accent-amber' : 'border-secondary',
      )}
    >
      {checked && <span className="size-2 rounded-full bg-accent-amber" />}
    </span>
  )
}

const SHOWN: readonly (keyof ProfileDisplayDto)[] = [
  'email',
  'phone',
  'onlineStatus',
  'publicationStats',
]

/**
 * NET ME, visibility and contact (spec sections 9 and 15): hidden, CMarket members or public;
 * Direct, Request or No for each of the six client types; what the profile shows.
 */
export function PrivacyFields({ editor }: { editor: ProfileEditor }) {
  const { t } = useTranslation()
  const name = useId()
  const { form, set, profile } = editor
  // Only an Analyst publishes, so only an Analyst has statistics to show.
  const shown = SHOWN.filter((key) => key !== 'publicationStats' || profile.stats !== null)

  return (
    <div className="flex flex-col gap-4 p-3">
      <section className="flex flex-col gap-2">
        <SectionTitle>{t('network.privacy.visibility')}</SectionTitle>
        <div
          role="radiogroup"
          aria-label={t('network.privacy.visibility')}
          className="flex flex-col gap-1.5"
        >
          {PROFILE_VISIBILITIES.map((visibility) => {
            const checked = form.visibility === visibility
            return (
              <label
                key={visibility}
                className={clsx(
                  'relative flex cursor-pointer items-center gap-3 border px-3 py-2',
                  checked ? 'border-accent-amber bg-selected' : 'hover:bg-panel-header',
                )}
              >
                <input
                  type="radio"
                  name={`${name}-visibility`}
                  value={visibility}
                  checked={checked}
                  onChange={() => set({ visibility })}
                  className="peer sr-only"
                />
                <RadioMark checked={checked} />
                <span className="flex min-w-0 flex-col">
                  <span className={clsx('font-sans text-label', checked && 'font-semibold')}>
                    {t(`network.privacy.visibilities.${visibility}.label`)}
                  </span>
                  <span className="font-sans text-title text-secondary">
                    {t(`network.privacy.visibilities.${visibility}.hint`)}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
      </section>

      <section className="flex flex-col gap-1">
        <div className="grid grid-cols-[minmax(0,1fr)_repeat(3,48px)] items-center">
          <SectionTitle>{t('network.privacy.whoCanContact')}</SectionTitle>
          {CONTACT_MODES.map((mode) => (
            <span
              key={mode}
              aria-hidden
              className="text-center font-sans text-title text-secondary"
            >
              {t(`network.privacy.modes.${mode}`)}
            </span>
          ))}
        </div>
        <div className="flex flex-col">
          {CLIENT_ACCOUNT_TYPES.map((type, index) => {
            const typeName = t(`accountBadge.${type}`)
            return (
              <div
                key={type}
                role="radiogroup"
                aria-label={typeName}
                className={clsx(
                  'grid h-8 grid-cols-[minmax(0,1fr)_repeat(3,48px)] items-center px-0.5',
                  index % 2 === 1 && 'bg-row-alt',
                )}
              >
                <span className="flex items-center gap-2 font-sans text-label">
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0"
                    style={{ backgroundColor: ACCOUNT_TYPE_COLORS[type] }}
                  />
                  {typeName}
                </span>
                {CONTACT_MODES.map((mode) => {
                  const checked = form.contactRules[type] === mode
                  return (
                    <label
                      key={mode}
                      className="relative flex h-8 cursor-pointer items-center justify-center"
                    >
                      <input
                        type="radio"
                        name={`${name}-${type}`}
                        value={mode}
                        checked={checked}
                        aria-label={t('network.privacy.modeFor', {
                          type: typeName,
                          mode: t(`network.privacy.modes.${mode}`),
                        })}
                        onChange={() =>
                          set({ contactRules: { ...form.contactRules, [type]: mode } })
                        }
                        className="peer sr-only"
                      />
                      <RadioMark checked={checked} />
                    </label>
                  )
                })}
              </div>
            )
          })}
        </div>
        <p className="font-sans text-title text-secondary">{t('network.privacy.requestNote')}</p>
      </section>

      <section className="flex flex-col gap-2">
        <SectionTitle>{t('network.privacy.displayed')}</SectionTitle>
        {shown.map((key) => (
          <Switch
            key={key}
            label={t(`network.privacy.show.${key}`)}
            checked={form.show[key]}
            onChange={(checked) => set({ show: { ...form.show, [key]: checked } })}
          />
        ))}
      </section>
    </div>
  )
}
