import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { useDownloadRfqTicket } from '@/entities/rfq-agreement'
import type { RfqAgreementDetailsDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { saveBlob } from '@/shared/lib/download'
import { Button } from '@/shared/ui/form/Button'
import { toast } from '@/shared/ui/toast'
import { SECTION, SECTION_HEADING } from './detailStyles'

/**
 * The ticket (spec, screen 23: "Download ticket PDF, Resend ticket"; "the ticket can be resent,
 * always as the same document"): when it was made and its SHA-256 fingerprint, the PDF to
 * download (a concluded or cancelled agreement's), the resend for whoever may act.
 */
export function AgreementTicket({
  details,
  onResend,
}: {
  details: RfqAgreementDetailsDto
  onResend: () => void
}) {
  const { t } = useTranslation()
  const format = useFormat()
  const id = useId()
  const download = useDownloadRfqTicket()
  const { agreement, ticket } = details
  const note = ticket
    ? t('rfqAgreements.detail.ticketMade', {
        date: `${format.date(ticket.generatedAt)} ${format.time(ticket.generatedAt)}`,
      })
    : details.hasTicket
      ? t('rfqAgreements.detail.ticketFirst')
      : agreement.status === 'awaitingSvt'
        ? t('rfqAgreements.detail.ticketAwaiting')
        : t('rfqAgreements.detail.ticketNone')

  return (
    <section aria-labelledby={id} className={SECTION}>
      <h3 id={id} className={SECTION_HEADING}>
        {t('rfqAgreements.detail.ticket')}
      </h3>
      <p className="text-data text-secondary">{note}</p>
      {ticket && (
        <p className="text-data">
          <span className="block text-secondary">{t('rfqAgreements.detail.fingerprint')}</span>
          <span className="font-mono break-all text-primary">{ticket.fingerprint}</span>
        </p>
      )}
      {(details.hasTicket || details.canResend) && (
        <div className="flex flex-wrap gap-2 pt-1">
          {details.hasTicket && (
            <Button
              busy={download.isPending}
              onClick={() =>
                download.mutate(agreement.id, {
                  onSuccess: (blob) => saveBlob(blob, `${agreement.number}.pdf`),
                  onError: (error) => toast.error(error.message),
                })
              }
            >
              {t('rfqAgreements.detail.download')}
            </Button>
          )}
          {details.canResend && (
            <Button onClick={onResend}>{t('rfqAgreements.detail.resend')}</Button>
          )}
        </div>
      )}
    </section>
  )
}
