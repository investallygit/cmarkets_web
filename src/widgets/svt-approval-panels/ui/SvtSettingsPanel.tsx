import { Pencil } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSvtSettings } from '@/entities/rfq'
import { SvtSettingsForm } from '@/features/edit-svt-settings'
import type { SvtSettingsDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Button } from '@/shared/ui/form/Button'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

/**
 * Screen 27's "Approval settings" (spec section 9; API /svt/settings): the Admin's window and
 * cut-off, then the bank's own: the four-eyes threshold, the authorised approvers, the default
 * client limit, the notification channels; the rejection reasons offered. Its SVT accounts edit
 * the bank's part.
 */
export function SvtSettingsPanel() {
  const { t } = useTranslation()
  const settings = useSvtSettings()
  const [editing, setEditing] = useState(false)

  return (
    <Panel
      title={t('panels.svtSettings')}
      code="CFG"
      options={
        !editing &&
        settings.data && (
          <Button size="sm" icon={Pencil} onClick={() => setEditing(true)}>
            {t('svt.settings.edit')}
          </Button>
        )
      }
    >
      <QueryView query={settings}>
        {(data) =>
          editing ? (
            <div className="min-h-0 flex-1 overflow-auto">
              <SvtSettingsForm settings={data} onDone={() => setEditing(false)} />
            </div>
          ) : (
            <SettingsView settings={data} />
          )
        }
      </QueryView>
    </Panel>
  )
}

function SettingsView({ settings }: { settings: SvtSettingsDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const { window: approvalWindow } = settings
  const authorised = settings.approvers.filter((approver) => approver.authorised).length
  const channels = [
    t('svt.settings.screen'),
    ...(settings.notifyByEmail ? [t('svt.settings.email')] : []),
    ...(settings.notifyBySms ? [t('svt.settings.sms')] : []),
  ]

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-3">
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 font-sans text-data">
        <Row label={t('svt.settings.window')}>
          {t('svt.settings.windowValue', { minutes: approvalWindow.minutes })}
        </Row>
        <Row label={t('svt.settings.cutOff')}>
          {t('svt.settings.cutOffValue', {
            cutOff: approvalWindow.cutOffTime.slice(0, 5),
            nextDay: approvalWindow.nextDayDeadline.slice(0, 5),
          })}
        </Row>
        <Row label={t('svt.settings.fourEyes')}>
          {t('svt.settings.fourEyesValue', {
            amount: format.compact(settings.fourEyesThreshold, 0),
          })}
        </Row>
        <Row label={t('svt.settings.approvers')}>
          {settings.allApprove
            ? t('svt.settings.allApprove', { count: settings.approvers.length })
            : t('svt.settings.approversCount', { count: authorised })}
        </Row>
        <Row label={t('svt.settings.defaultLimit')}>
          {settings.defaultClientLimit === null
            ? t('svt.settings.noDefaultLimit')
            : t('svt.settings.defaultLimitValue', {
                amount: format.compact(settings.defaultClientLimit, 0),
              })}
        </Row>
        <Row label={t('svt.settings.notifications')}>{channels.join(', ')}</Row>
      </dl>
      <p className="font-sans text-data text-secondary">{t('svt.settings.adminWindow')}</p>
      <section aria-labelledby="svt-reasons" className="flex flex-col gap-1">
        <h3
          id="svt-reasons"
          className="font-sans text-label font-semibold tracking-title text-accent-amber uppercase"
        >
          {t('svt.settings.reasons')}
        </h3>
        <ul className="flex flex-col gap-0.5 font-sans text-data text-primary">
          {settings.rejectionReasons.map((reason) => (
            <li key={reason}>· {t(`svt.reasons.${reason}`)}</li>
          ))}
        </ul>
      </section>
      {settings.updatedAt && (
        <p className="font-sans text-data text-secondary">
          {t('svt.settings.updated', {
            date: `${format.date(settings.updatedAt)} ${format.time(settings.updatedAt)}`,
            name: settings.updatedBy ?? '',
          })}
        </p>
      )}
    </div>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-secondary">{label}</dt>
      <dd className="text-right font-mono text-primary">{children}</dd>
    </>
  )
}
