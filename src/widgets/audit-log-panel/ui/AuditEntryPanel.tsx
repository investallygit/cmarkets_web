import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AccountTypeText } from '@/entities/account'
import { useAuditText } from '@/entities/audit'
import type { AuditEntryDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { PanelEmpty } from '@/shared/ui/StatusViews'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/60 py-1">
      <dt className="shrink-0 font-sans text-data text-secondary">{label}</dt>
      <dd className="text-right font-sans text-data">{children}</dd>
    </div>
  )
}

/** AUDT, one entry: who, what, when, why, and each value before and after. */
export function AuditEntryPanel({ entry }: { entry: AuditEntryDto | null }) {
  const { t } = useTranslation()
  const format = useFormat()
  const text = useAuditText()

  return (
    <Panel title={t('panels.auditEntry')} code="AUDT">
      {entry === null ? (
        <PanelEmpty message={t('audit.choose')} />
      ) : (
        <div className="flex flex-col gap-3 p-2">
          <dl>
            <Row label={t('audit.when')}>
              <span className="font-mono">
                {format.date(entry.at)} {format.time(entry.at, true)}
              </span>
            </Row>
            <Row label={t('audit.who')}>
              {entry.actor.displayName} · <AccountTypeText type={entry.actor.accountType} />
            </Row>
            <Row label={t('audit.action')}>{text.action(entry.action)}</Row>
            <Row label={t('audit.target')}>
              <span className="text-secondary">{t(`audit.targetTypes.${entry.target.type}`)}</span>{' '}
              {text.target(entry.target)}
            </Row>
            {entry.reason && <Row label={t('form.reason')}>{entry.reason}</Row>}
          </dl>
          {entry.changes.length > 0 && (
            <table className="w-full font-sans text-data">
              <caption className="pb-1 text-left font-sans text-title font-semibold tracking-title text-accent-amber uppercase">
                {t('audit.changes')}
              </caption>
              <thead>
                <tr className="border-b text-secondary">
                  <th scope="col" className="py-0.5 pr-2 text-left font-normal">
                    {t('audit.field')}
                  </th>
                  <th scope="col" className="py-0.5 pr-2 text-right font-normal">
                    {t('audit.before')}
                  </th>
                  <th scope="col" className="py-0.5 text-right font-normal">
                    {t('audit.after')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {entry.changes.map((change) => (
                  <tr
                    key={`${change.field}|${change.scope ?? ''}`}
                    className="border-b border-border/60"
                  >
                    <th scope="row" className="py-0.5 pr-2 text-left font-normal">
                      {text.field(change)}
                    </th>
                    <td className="py-0.5 pr-2 text-right font-mono text-secondary">
                      {text.value(change, change.before)}
                    </td>
                    <td className="py-0.5 text-right font-mono">
                      {text.value(change, change.after)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </Panel>
  )
}
