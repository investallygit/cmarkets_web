import { clsx } from 'clsx'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { ContactRulesGrid, PROFILE_VISIBILITIES, RadioMark } from '@/entities/profile'
import type { ProfileDisplayDto } from '@/shared/api/contracts'
import { Switch } from '@/shared/ui/form/Switch'
import type { ProfileEditor } from '../model/useProfileEditor'
import { SectionTitle } from './SectionTitle'

const SHOWN: readonly (keyof ProfileDisplayDto)[] = [
  'email',
  'phone',
  'onlineStatus',
  'publicationStats',
]

/**
 * NET ME, visibility and contact (spec sections 9 and 15): hidden, CMarket members or public;
 * Direct, Request or No for each of the seven client types; what the profile shows.
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
        <ContactRulesGrid
          title={<SectionTitle>{t('network.privacy.whoCanContact')}</SectionTitle>}
          rules={form.contactRules}
          onChange={(contactRules) => set({ contactRules })}
        />
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
