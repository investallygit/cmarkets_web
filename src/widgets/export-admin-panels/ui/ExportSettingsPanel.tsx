import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useExportAdminSettings, useSaveExportAdminSettings } from '@/entities/data-export'
import type { AccountType, ExportAdminSettingsDto, ExportLimitDto } from '@/shared/api/contracts'
import { Button } from '@/shared/ui/form/Button'
import { Checkbox } from '@/shared/ui/form/Checkbox'
import { NumberInput } from '@/shared/ui/form/NumberInput'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { toast } from '@/shared/ui/toast'

/**
 * ADMCFG's data download (spec section 9, screen 30: "Limits can be set by the Admin"; ROADMAP
 * decision 41): the sources DL downloads, EODHD's until its licence is confirmed, and each
 * profile's files a day, rows a file, years of history, CSV only and scheduled exports; an empty
 * number is unlimited.
 */
export function ExportSettingsPanel() {
  const { t } = useTranslation()
  const settings = useExportAdminSettings()
  return (
    <Panel title={t('panels.exportAdmin')} code="CFG" bodyClassName="overflow-auto">
      <QueryView query={settings}>{(loaded) => <Form initial={loaded} />}</QueryView>
    </Panel>
  )
}

const NUMBERS = ['perDay', 'rowsPerFile', 'historyYears', 'schedules'] as const

function Form({ initial }: { initial: ExportAdminSettingsDto }) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState(initial)
  const save = useSaveExportAdminSettings()
  const setLimit = (accountType: string, change: Partial<ExportLimitDto>) =>
    setDraft((current) => ({
      ...current,
      limits: current.limits.map((limit) =>
        limit.accountType === accountType ? { ...limit, ...change } : limit,
      ),
    }))
  return (
    <form
      className="grid gap-3 p-3"
      onSubmit={(event) => {
        event.preventDefault()
        save.mutate(draft, {
          onSuccess: (saved) => {
            setDraft(saved)
            toast.success(t('downloads.admin.saved'))
          },
          onError: (error) => toast.error(error.message),
        })
      }}
    >
      <fieldset className="flex flex-wrap gap-x-5 gap-y-2">
        <legend className="mb-1.5 font-sans text-data text-secondary">
          {t('downloads.admin.sources')}
        </legend>
        {(['files', 'cmarket', 'eodhd'] as const).map((source) => (
          <Checkbox
            key={source}
            checked={draft.sources[source]}
            label={t(`downloads.sources.${source}`)}
            onChange={(checked) =>
              setDraft((current) => ({
                ...current,
                sources: { ...current.sources, [source]: checked },
              }))
            }
          />
        ))}
      </fieldset>
      <p className="font-sans text-caption text-secondary">{t('downloads.admin.eodhdNote')}</p>
      <table className="w-full font-sans text-data">
        <caption className="sr-only">{t('downloads.admin.limits')}</caption>
        <thead>
          <tr className="text-secondary">
            <th scope="col" className="text-left font-normal">
              {t('downloads.log.profile')}
            </th>
            {NUMBERS.map((key) => (
              <th key={key} scope="col" className="text-right font-normal">
                {t(`downloads.admin.${key}`)}
              </th>
            ))}
            <th scope="col" className="text-center font-normal">
              {t('downloads.limits.csvOnly')}
            </th>
          </tr>
        </thead>
        <tbody>
          {draft.limits.map((limit) => {
            const profile = t(`accountBadge.${limit.accountType as AccountType}`)
            return (
              <tr key={limit.accountType}>
                <th scope="row" className="py-0.5 text-left font-normal">
                  {profile}
                </th>
                {NUMBERS.map((key) => (
                  <td key={key} className="py-0.5 pl-2">
                    <NumberInput
                      aria-label={`${profile} · ${t(`downloads.admin.${key}`)}`}
                      value={limit[key]}
                      decimals={0}
                      placeholder={t('downloads.limits.unlimited')}
                      onChange={(value) => setLimit(limit.accountType, { [key]: value })}
                    />
                  </td>
                ))}
                <td className="py-0.5 text-center">
                  <Checkbox
                    aria-label={`${profile} · ${t('downloads.limits.csvOnly')}`}
                    checked={limit.csvOnly}
                    onChange={(csvOnly) => setLimit(limit.accountType, { csvOnly })}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div>
        <Button type="submit" variant="primary" busy={save.isPending}>
          {t('common.save')}
        </Button>
      </div>
    </form>
  )
}
