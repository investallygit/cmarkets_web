import clsx from 'clsx'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { recipientLabelKey, recipientName } from '@/entities/rfq-agreement'
import type { RfqAgreementDetailsDto, RfqEmailStatus } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { SECTION, SECTION_HEADING } from './detailStyles'

/** The list's e-mail badges' colours (EMAIL_TONES), for the log's words. */
const STATUS_TEXT: Readonly<Record<RfqEmailStatus, string>> = {
  sent: 'text-up',
  failed: 'text-down',
  resent: 'text-info',
}

/**
 * "E-mail log per recipient" (spec, screen 23): the requesting trader, the responding trader and
 * each SVT's securities back office, with their e-mails oldest first: the ticket sent, failed or
 * sent again, a notice; the mail server's answer to a failure, for the Admin.
 */
export function AgreementEmails({ details }: { details: RfqAgreementDetailsDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const id = useId()
  const { agreement, recipients } = details
  const when = (at: string) => `${format.dayMonth(at)} ${format.time(at)}`
  const none = recipients.every((recipient) => recipient.emails.length === 0)
  return (
    <section aria-labelledby={id} className={SECTION}>
      <h3 id={id} className={SECTION_HEADING}>
        {t('rfqAgreements.detail.emails')}
      </h3>
      {none ? (
        <p className="text-data text-secondary">{t('rfqAgreements.detail.emailsNone')}</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {recipients.map((recipient) => (
            <li key={recipient.kind} className="flex flex-col gap-0.5">
              <span className="text-primary">
                {t(recipientLabelKey(recipient.kind, agreement), {
                  name: recipientName(recipient, agreement),
                })}
              </span>
              {recipient.emails.length === 0 ? (
                <span className="text-data text-secondary">
                  {t('rfqAgreements.detail.noEmail')}
                </span>
              ) : (
                <ul className="flex flex-col">
                  {recipient.emails.map((email) => (
                    <li
                      key={`${email.kind}-${email.at}-${email.status}`}
                      className="flex flex-wrap items-baseline justify-between gap-x-3 text-data"
                    >
                      <span className="text-secondary">
                        {t(`rfqAgreements.detail.emailKind.${email.kind}`)}
                      </span>
                      <span className={clsx('font-mono', STATUS_TEXT[email.status])}>
                        {t('rfqAgreements.detail.emailLine', {
                          status: t(`rfqAgreements.emailStatus.${email.status}`),
                          date: when(email.at),
                        })}
                      </span>
                      {email.error && (
                        <span className="basis-full break-words text-down">{email.error}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
