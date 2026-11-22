import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDescription, type DescriptionLanguage } from '@/entities/security'
import { useHasPermission } from '@/entities/session'
import { DescriptionDialog } from '@/features/describe-security'
import type { DescribedObject, DescriptionDto } from '@/shared/api/contracts'
import { useFormat, useLocale } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { PanelTabs } from '@/shared/ui/PanelTabs'
import { QueryView } from '@/shared/ui/QueryView'
import { PanelEmpty } from '@/shared/ui/StatusViews'

interface SecurityDescriptionPanelProps {
  /** A security (a commodity is one), or an index on its profile (screen 31). */
  type?: DescribedObject
  id: string | undefined
  /** Display code, e.g. "SEMC". */
  code: string | undefined
  /** The screen's code in the title bar: EQS under its results, DES under the chart. */
  screen: 'EQS' | 'DES'
}

/**
 * A description of a security or an index (spec section 9, screens 2, 3 and 31, fifth version):
 * its issuer, business and key dates, or an index's purpose and method, in the screen's language
 * when written, else in the other one, marked (ROADMAP decision 9); FR · EN when both are; below
 * it, the documents it was written from and its date, or EODHD's English said so. "Edit" for those
 * who write descriptions, an Analyst of CMarket (ROADMAP decision 40). API: GET
 * /securities/{id}/description?lang= or /indices/{code}/description?lang=.
 */
export function SecurityDescriptionPanel({
  type = 'security',
  id,
  code,
  screen,
}: SecurityDescriptionPanelProps) {
  const { t } = useTranslation()
  const locale = useLocale()
  const format = useFormat()
  // Kept from one security to the next, as a reading choice.
  const [chosen, setChosen] = useState<DescriptionLanguage | null>(null)
  const [editing, setEditing] = useState(false)
  const mayEdit = useHasPermission('descriptions:write')
  const description = useDescription(type, id, chosen ?? locale)
  const shown = description.data ?? null

  return (
    <Panel
      title={
        screen === 'EQS' && code
          ? t('description.title', { code })
          : t('panels.securityDescription')
      }
      code={screen}
      options={
        <>
          {shown &&
            (shown.languages.length > 1 ? (
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
            ))}
          {mayEdit && id && code && (
            <>
              <span aria-hidden>·</span>
              <button
                type="button"
                onClick={() => setEditing(true)}
                aria-label={t('description.editLabel', { code })}
                className="min-h-6 text-info hover:underline"
              >
                {t('description.edit')}
              </button>
            </>
          )}
        </>
      }
    >
      {!id ? (
        <PanelEmpty message={t('description.noSecurity')} />
      ) : (
        <QueryView query={description}>
          {(data) =>
            data ? (
              <DescriptionText description={data} wanted={locale} format={format} />
            ) : (
              <PanelEmpty message={t('description.none', { code: code ?? id })} />
            )
          }
        </QueryView>
      )}
      {mayEdit && id && code && (
        <DescriptionDialog
          open={editing}
          onClose={() => setEditing(false)}
          type={type}
          id={id}
          code={code}
        />
      )}
    </Panel>
  )
}

function DescriptionText({
  description,
  wanted,
  format,
}: {
  description: DescriptionDto
  wanted: DescriptionLanguage
  format: ReturnType<typeof useFormat>
}) {
  const { t } = useTranslation()
  const date = format.date(description.updatedAt)
  return (
    <div className="grid max-w-[120ch] gap-1 px-3 py-1.5 font-sans text-label">
      {/* The screen's language not written: whatever the reader chose before. */}
      {!description.languages.includes(wanted) && (
        <p className="text-secondary">
          {t('description.fallback', {
            language: t(`description.languageNames.${description.language}`),
          })}
        </p>
      )}
      <p lang={description.language} className="whitespace-pre-line text-primary">
        {description.text}
      </p>
      <p className="text-caption text-secondary">
        {description.origin === 'eodhd'
          ? t('description.eodhd', { date })
          : description.source
            ? t('description.footer', { source: description.source, date })
            : t('description.footerNoSource', { date })}
      </p>
    </div>
  )
}
