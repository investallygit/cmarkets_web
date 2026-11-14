import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCommodity, useCommodityNames } from '@/entities/commodity'
import { shownDescription, type DescriptionLanguage } from '@/entities/security'
import { useLocale } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { PanelTabs } from '@/shared/ui/PanelTabs'
import { QueryView } from '@/shared/ui/QueryView'
import { ScrollArea } from '@/shared/ui/ScrollArea'
import { PanelEmpty } from '@/shared/ui/StatusViews'

/**
 * Screen 21, the description (spec section 9): the Data admin's text in French or English (what
 * the product is, its market, why it matters for the CEMAC zone), in the screen's language when
 * written, else in the other one, marked (ROADMAP decision 9); then its unit, frequency and the
 * year its history starts. API /commodities/{code}.
 */
export function CommodityDescriptionPanel({ code }: { code: string }) {
  const { t } = useTranslation()
  const locale = useLocale()
  const names = useCommodityNames()
  const [chosen, setChosen] = useState<DescriptionLanguage | null>(null)
  const profile = useCommodity(code)
  const shown = shownDescription(profile.data?.description, chosen ?? locale)

  return (
    <Panel
      title={t('panels.commodityDescription')}
      code="DES"
      options={
        shown && (
          <>
            <span>{t('description.source', { source: t('description.sources.dataAdmin') })}</span>
            <span aria-hidden>·</span>
            {shown.languages.length > 1 ? (
              <PanelTabs
                value={shown.language}
                options={shown.languages.map((language) => ({
                  value: language,
                  label: t(`description.languages.${language}`),
                }))}
                onChange={setChosen}
              />
            ) : (
              <span>{t(`description.languages.${shown.language}`)}</span>
            )}
          </>
        )
      }
      bodyClassName="flex min-h-0 flex-col"
    >
      <QueryView query={profile}>
        {(data) => (
          <>
            <ScrollArea className="min-h-0 flex-1 px-3 py-1.5 font-sans text-label">
              {shown ? (
                <div className="grid max-w-[120ch] gap-1">
                  {!shown.languages.includes(locale) && (
                    <p className="text-secondary">
                      {t('description.fallback', {
                        language: t(`description.languageNames.${shown.language}`),
                      })}
                    </p>
                  )}
                  <p lang={shown.language} className="whitespace-pre-line text-primary">
                    {shown.text}
                  </p>
                </div>
              ) : (
                <PanelEmpty message={t('commodities.description.none')} />
              )}
            </ScrollArea>
            <p className="shrink-0 border-t px-3 py-1 font-sans text-title text-secondary">
              {t('commodities.description.facts', {
                unit: names.unit(data.unit),
                frequency: names.frequency(data.frequency).toLowerCase(),
                since: data.historyStart ? data.historyStart.slice(0, 4) : '—',
              })}
            </p>
          </>
        )}
      </QueryView>
    </Panel>
  )
}
