import { useQueryClient } from '@tanstack/react-query'
import { useRfqEvent } from '@/shared/realtime'
import { rfqAgreementKeys } from './queries'

/**
 * The agreements' screen kept current (ROADMAP step 46), mounted once by the app shell: an
 * agreement made at a confirmation reaches its parties' lists and its SVTs' at once; an SVT's
 * decision (step 45) reads the agreement's approvals again, and its end (concluded, rejected or
 * expired) its status in the lists. The ticket's e-mails follow by a job: the next reading shows
 * them.
 */
export function useRfqAgreementSync() {
  const queryClient = useQueryClient()
  useRfqEvent('AgreementCreated', () => {
    void queryClient.invalidateQueries({ queryKey: rfqAgreementKeys.lists() })
    void queryClient.invalidateQueries({ queryKey: rfqAgreementKeys.options() })
  })
  useRfqEvent('ApprovalDecided', ({ agreementId }) => {
    void queryClient.invalidateQueries({ queryKey: rfqAgreementKeys.detail(agreementId) })
  })
  const ended = ({ agreementId }: { agreementId: string }) => {
    void queryClient.invalidateQueries({ queryKey: rfqAgreementKeys.lists() })
    void queryClient.invalidateQueries({ queryKey: rfqAgreementKeys.detail(agreementId) })
  }
  useRfqEvent('AgreementConcluded', ended)
  useRfqEvent('AgreementRejected', ended)
}
