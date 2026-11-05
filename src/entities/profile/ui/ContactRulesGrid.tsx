import { clsx } from 'clsx'
import { useId, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { CLIENT_ACCOUNT_TYPES, type ContactRules } from '@/shared/api/contracts'
import { ACCOUNT_TYPE_COLORS } from '@/shared/config/accountTypes'
import { CONTACT_MODES } from '../config/profiles'
import { RadioMark } from './RadioMark'

interface ContactRulesGridProps {
  /** The heading, beside the names of the three modes. */
  title: ReactNode
  rules: ContactRules
  onChange: (rules: ContactRules) => void
}

/**
 * "Who can contact me" (spec section 15): Direct, Request or No for each of the six client types,
 * a group of radio buttons per type; a profile's rules in NET ME, the Admin's defaults in ADMCFG.
 */
export function ContactRulesGrid({ title, rules, onChange }: ContactRulesGridProps) {
  const { t } = useTranslation()
  const name = useId()
  return (
    <>
      <div className="grid grid-cols-[minmax(0,1fr)_repeat(3,48px)] items-center">
        {title}
        {CONTACT_MODES.map((mode) => (
          <span key={mode} aria-hidden className="text-center font-sans text-title text-secondary">
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
              {CONTACT_MODES.map((mode) => (
                <label
                  key={mode}
                  className="relative flex h-8 cursor-pointer items-center justify-center"
                >
                  <input
                    type="radio"
                    name={`${name}-${type}`}
                    value={mode}
                    checked={rules[type] === mode}
                    aria-label={t('network.privacy.modeFor', {
                      type: typeName,
                      mode: t(`network.privacy.modes.${mode}`),
                    })}
                    onChange={() => onChange({ ...rules, [type]: mode })}
                    className="peer sr-only"
                  />
                  <RadioMark checked={rules[type] === mode} />
                </label>
              ))}
            </div>
          )
        })}
      </div>
    </>
  )
}
