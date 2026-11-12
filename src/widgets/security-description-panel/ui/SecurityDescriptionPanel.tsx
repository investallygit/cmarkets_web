import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { shownDescription, useSecurityProfile, type DescriptionLanguage } from '@/entities/security'
import { useLocale } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { PanelTabs } from '@/shared/ui/PanelTabs'
import { QueryView } from '@/shared/ui/QueryView'
import { PanelEmpty } from '@/shared/ui/StatusViews'

interface SecurityDescriptionPanelProps {
  securityId: string | undefined
  /** Display code of the security, e.g. "SEMC". */
  code: string | undefined
}

/**
 * Screen 3, the description of the selected security (spec section 9): its business, markets and
 * listing history, in French or English, and who wrote it, the Data admin or EODHD. In the
 * language of the screen when written, else in the other one, marked (ROADMAP decision 9); a
 * choice between the two when both are. API: the description of /securities/{id}.
 */
export function SecurityDescriptionPanel({ securityId, code }: SecurityDescriptionPanelProps) {
  const { t } = useTranslation()
  const locale = useLocale()
  // Kept from one security to the next, as a reading choice.
  const [chosen, setChosen] = useState<DescriptionLanguage | null>(null)
  const profile = useSecurityProfile(securityId)
  const shown = shownDescription(profile.data?.description, chosen ?? locale)

  return (
    <Panel
      title={code ? t('description.title', { code }) : t('panels.securityDescription')}
      code="EQS"
      options={
        shown && (
          <>
            <span>
              {t('description.source', { source: t(`description.sources.${shown.source}`) })}
            </span>
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
    >
      {!securityId ? (
        <PanelEmpty message={t('description.noSecurity')} />
      ) : (
        <QueryView query={profile}>
          {(data) =>
            shown ? (
              <div className="grid max-w-[120ch] gap-1 px-3 py-1.5 font-sans text-label">
                {/* The screen's language not written: whatever the reader chose before. */}
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
              <PanelEmpty message={t('description.none', { code: data.code })} />
            )
          }
        </QueryView>
      )}
    </Panel>
  )
}
