import { useId, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AGREEMENT_TONES, formatQuote } from '@/entities/rfq'
import { EMAIL_TONES, useRfqAgreement } from '@/entities/rfq-agreement'
import { CancelAgreementDialog } from '@/features/cancel-rfq-agreement'
import { ResendTicketDialog } from '@/features/resend-rfq-ticket'
import type { RfqAgreementDetailsDto, RfqPartyDto } from '@/shared/api/contracts'
import { useFormat, useLocale } from '@/shared/i18n'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/form/Button'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { ScrollArea } from '@/shared/ui/ScrollArea'
import { AgreementApprovals } from './AgreementApprovals'
import { AgreementEmails } from './AgreementEmails'
import { AgreementTicket } from './AgreementTicket'
import { SECTION, SECTION_HEADING } from './detailStyles'

/**
 * Screen 23's detail (spec: "Original request and agreement rank (e.g. 1 / 3), buyer and seller
 * (organisation, trader, chosen SVT), security and CRCT code, face amount, price and rate, amount,
 * settlement date; e-mail log per recipient; Download ticket PDF, Resend ticket, Cancel
 * agreement"): the agreement picked, both SVTs' approvals, its e-mails, its ticket, its
 * cancellation once entered.
 */
export function AgreementDetailPanel({ id }: { id: string | null }) {
  const { t } = useTranslation()
  const details = useRfqAgreement(id)
  const number = details.data?.agreement.number
  return (
    <Panel
      title={number ? t('rfqAgreements.detail.title', { number }) : t('panels.rfqAgreement')}
      code="RFQ AGR"
      bodyClassName="flex flex-col"
    >
      {id === null ? (
        <p className="p-3 font-sans text-data text-secondary">{t('rfqAgreements.detail.empty')}</p>
      ) : (
        <QueryView query={details}>{(data) => <AgreementDetail details={data} />}</QueryView>
      )}
    </Panel>
  )
}

function AgreementDetail({ details }: { details: RfqAgreementDetailsDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const locale = useLocale()
  const [cancelling, setCancelling] = useState(false)
  const [resending, setResending] = useState(false)
  const cancellationId = useId()
  const { agreement, request, cancellation } = details
  const xaf = (amount: number) =>
    t('rfqAgreements.detail.amountXaf', { amount: format.number(amount, 0) })
  const party = (who: RfqPartyDto) => `${who.name} · ${who.organization}`
  // The status's moment: concluded at the second approval; ended when rejected, expired or
  // cancelled; made at the confirmation while it waits.
  const at =
    agreement.status === 'concluded'
      ? agreement.concludedAt
      : agreement.status === 'awaitingSvt'
        ? agreement.createdAt
        : details.endedAt
  const quote = `${formatQuote(agreement.price, locale)}% · ${formatQuote(agreement.ratePct, locale)}%`

  return (
    <ScrollArea className="min-h-0 flex-1 font-sans text-label">
      <div className="flex flex-col gap-3 p-3">
        <div className="flex flex-wrap gap-2">
          <Badge tone={AGREEMENT_TONES[agreement.status]}>
            {t('rfqAgreements.detail.statusOn', {
              status: t(`rfqTrading.agreementStatus.${agreement.status}`),
              date: at ? `${format.dayMonth(at)} ${format.time(at)}` : '',
            })}
          </Badge>
          {agreement.emailStatus && (
            <Badge tone={EMAIL_TONES[agreement.emailStatus]}>
              {t(`rfqAgreements.emailBadge.${agreement.emailStatus}`)}
            </Badge>
          )}
        </div>

        <dl className="grid grid-cols-[minmax(7rem,auto)_1fr] gap-x-3 gap-y-1.5">
          <Row label={t('rfqAgreements.detail.request')}>
            {`${request.number} · `}
            <span className="whitespace-nowrap">
              {t('rfqAgreements.detail.rank', { rank: details.rank, count: request.agreements })}
            </span>
            {request.anonymous && (
              <span className="text-secondary">{` · ${t('rfqAgreements.detail.anonymous')}`}</span>
            )}
          </Row>
          <Row label={t('rfqAgreements.detail.buyer')}>{party(agreement.buyer)}</Row>
          <Row label={t('rfqAgreements.detail.buyerSvt')}>{agreement.buyerSvt.name}</Row>
          <Row label={t('rfqAgreements.detail.seller')}>{party(agreement.seller)}</Row>
          <Row label={t('rfqAgreements.detail.sellerSvt')}>{agreement.sellerSvt.name}</Row>
          <Row label={t('rfqAgreements.detail.security')}>
            <span className="text-accent-amber">{agreement.security.code}</span>
            {agreement.security.isin && (
              <span className="font-mono">{` · ${agreement.security.isin}`}</span>
            )}
          </Row>
          <Row label={t('rfqAgreements.detail.nominal')}>{xaf(agreement.faceAmount)}</Row>
          <Row
            label={
              agreement.security.instrument === 'BTA'
                ? t('rfqAgreements.detail.priceRate')
                : t('rfqAgreements.detail.priceYield')
            }
          >
            {quote}
          </Row>
          <Row label={t('rfqAgreements.detail.accrued')}>
            {formatQuote(agreement.accruedInterest, locale)}
          </Row>
          <Row label={t('rfqAgreements.detail.amount')}>
            <span className="text-info">{xaf(agreement.settlementAmount)}</span>
          </Row>
          <Row label={t('rfqAgreements.detail.settlementDate')}>
            {format.isoDate(agreement.settlementDate)}
          </Row>
        </dl>
        <p className="text-data text-secondary">{t('rfqAgreements.detail.amountNote')}</p>

        <AgreementApprovals details={details} />
        <AgreementEmails details={details} />
        <AgreementTicket details={details} onResend={() => setResending(true)} />

        {cancellation && (
          <section aria-labelledby={cancellationId} className={SECTION}>
            <h3 id={cancellationId} className={SECTION_HEADING}>
              {t('rfqAgreements.detail.cancellation')}
            </h3>
            <p>
              <span className="block text-data text-secondary">
                {t('rfqAgreements.detail.reason')}
              </span>
              {cancellation.reason}
            </p>
            <p className="text-data text-secondary">
              {t('rfqAgreements.detail.enteredBy', {
                name: cancellation.enteredBy.name,
                organization: cancellation.enteredBy.organization,
                date: `${format.date(cancellation.enteredAt)} ${format.time(cancellation.enteredAt)}`,
              })}
            </p>
            <p className="text-data text-secondary">{t('rfqAgreements.detail.letters')}</p>
            <ul className="text-data">
              <li>
                {t('rfqAgreements.detail.requesterLetter', {
                  name: `${cancellation.requesterLetter.fileName} (${format.fileSize(cancellation.requesterLetter.length)})`,
                })}
              </li>
              <li>
                {t('rfqAgreements.detail.responderLetter', {
                  name: `${cancellation.responderLetter.fileName} (${format.fileSize(cancellation.responderLetter.length)})`,
                })}
              </li>
            </ul>
          </section>
        )}

        {details.canCancel && (
          <div className="flex flex-col gap-1.5 border-t pt-2">
            <Button variant="danger" onClick={() => setCancelling(true)}>
              {t('rfqAgreements.detail.cancel')}
            </Button>
            <p className="text-data text-secondary">{t('rfqAgreements.detail.cancelRule')}</p>
          </div>
        )}
      </div>
      <CancelAgreementDialog
        details={cancelling ? details : null}
        onClose={() => setCancelling(false)}
      />
      <ResendTicketDialog
        details={resending ? details : null}
        onClose={() => setResending(false)}
      />
    </ScrollArea>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-secondary">{label}</dt>
      <dd className="text-right break-words text-primary">{children}</dd>
    </>
  )
}
