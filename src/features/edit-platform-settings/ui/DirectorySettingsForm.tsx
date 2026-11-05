import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSaveDirectorySettings } from '@/entities/platform-settings'
import { ContactRulesGrid } from '@/entities/profile'
import { isApiError } from '@/shared/api'
import {
  CLIENT_ACCOUNT_TYPES,
  type DirectorySettingsDto,
  type DirectorySettingsUpdateDto,
} from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { NumberInput } from '@/shared/ui/form/NumberInput'
import { toast } from '@/shared/ui/toast'
import { Section, SectionTitle } from './Section'

const MAX_DAILY = 1_000
const MAX_THRESHOLD = 100

type PerDay = Record<keyof DirectorySettingsDto['newConversationsPerDay'], number | null>

const isCount = (value: number | null, min: number, max: number) =>
  value !== null && Number.isInteger(value) && value >= min && value <= max

/**
 * ADMCFG, the directory and the messaging (spec section 15): the contact rules of the profiles
 * whose owners never chose theirs, the new conversations a client opens a day, and the open
 * reports beyond which an account is referred to the Admin. Saved together; each change is
 * written to the audit log.
 */
export function DirectorySettingsForm({ settings }: { settings: DirectorySettingsDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const save = useSaveDirectorySettings()
  const [rules, setRules] = useState(settings.defaultContactRules)
  const [perDay, setPerDay] = useState<PerDay>(settings.newConversationsPerDay)
  const [threshold, setThreshold] = useState<number | null>(settings.reportThreshold)
  const [submitted, setSubmitted] = useState(false)

  const local: Record<string, string | null> = {
    perDay: CLIENT_ACCOUNT_TYPES.some((type) => !isCount(perDay[type], 0, MAX_DAILY))
      ? t('directorySettings.errors.perDay', { max: format.number(MAX_DAILY, 0) })
      : null,
    reportThreshold: isCount(threshold, 1, MAX_THRESHOLD)
      ? null
      : t('directorySettings.errors.threshold', { max: MAX_THRESHOLD }),
  }
  const server = isApiError(save.error, 400) ? (save.error.problem.errors ?? {}) : {}
  const serverPerDay = CLIENT_ACCOUNT_TYPES.map(
    (type) => server[`newConversationsPerDay.${type}`]?.[0],
  ).find(Boolean)
  const error = (field: string) =>
    (submitted && local[field]) || (field === 'perDay' ? serverPerDay : server[field]?.[0])

  const update = {
    defaultContactRules: rules,
    newConversationsPerDay: perDay,
    reportThreshold: threshold,
  }
  const changed =
    JSON.stringify(update) !==
    JSON.stringify({
      defaultContactRules: settings.defaultContactRules,
      newConversationsPerDay: settings.newConversationsPerDay,
      reportThreshold: settings.reportThreshold,
    })

  const reset = () => {
    save.reset()
    setSubmitted(false)
    setRules(settings.defaultContactRules)
    setPerDay(settings.newConversationsPerDay)
    setThreshold(settings.reportThreshold)
  }

  return (
    <form
      noValidate
      className="flex h-full flex-col"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (Object.values(local).some(Boolean) || !changed) return
        save.mutate(update as DirectorySettingsUpdateDto, {
          onSuccess: () => {
            setSubmitted(false)
            toast.success(t('directorySettings.saved'))
          },
        })
      }}
    >
      <div className="min-h-0 flex-1 overflow-auto">
        <Section title={null}>
          <ContactRulesGrid
            title={<SectionTitle>{t('directorySettings.rules')}</SectionTitle>}
            rules={rules}
            onChange={setRules}
          />
          <p className="font-sans text-data text-secondary">{t('directorySettings.rulesHint')}</p>
        </Section>

        <Section title={t('directorySettings.perDay')}>
          <table className="w-fit font-sans text-data">
            <tbody>
              {CLIENT_ACCOUNT_TYPES.map((type) => (
                <tr key={type}>
                  <th scope="row" className="pr-6 text-left font-normal">
                    {t(`accountTypes.${type}`)}
                  </th>
                  <td className="py-0.5">
                    <NumberInput
                      value={perDay[type]}
                      onChange={(value) => setPerDay((current) => ({ ...current, [type]: value }))}
                      decimals={0}
                      aria-label={t('directorySettings.perDayOf', {
                        type: t(`accountTypes.${type}`),
                      })}
                      highlight
                      className="w-28"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="font-sans text-data text-secondary">{t('directorySettings.perDayHint')}</p>
          {error('perDay') && (
            <p role="alert" className="font-sans text-data text-down">
              {error('perDay')}
            </p>
          )}
        </Section>

        <Section title={t('directorySettings.threshold')}>
          <Field
            label={t('directorySettings.threshold')}
            hint={t('directorySettings.thresholdHint')}
            error={error('reportThreshold')}
          >
            <NumberInput
              value={threshold}
              onChange={setThreshold}
              decimals={0}
              highlight
              className="w-24"
            />
          </Field>
        </Section>
      </div>

      <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t px-3 py-2">
        <span className="mr-auto font-sans text-data text-secondary">
          {settings.updatedAt &&
            t('platformSettings.updated', {
              date: `${format.date(settings.updatedAt)} ${format.time(settings.updatedAt)}`,
              name: settings.updatedBy ?? '',
            })}
        </span>
        {save.error && !isApiError(save.error, 400) && (
          <span role="alert" className="font-sans text-data text-down">
            {save.error.message}
          </span>
        )}
        <Button type="button" disabled={!changed} onClick={reset}>
          {t('platformSettings.cancel')}
        </Button>
        <Button type="submit" variant="primary" disabled={!changed} busy={save.isPending}>
          {t('directorySettings.save')}
        </Button>
      </footer>
    </form>
  )
}
