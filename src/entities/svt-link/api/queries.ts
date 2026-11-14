import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { rfqApi } from '@/shared/api/endpoints'

export const svtLinkKeys = {
  all: ['svt-links'] as const,
  /** The trader's links ("My SVTs", screen 22). */
  mine: () => ['svt-links', 'mine'] as const,
  /** The bank's requests and linked traders (TRD). */
  bank: () => ['svt-links', 'bank'] as const,
}

/** GET /me/svt: the trader's links, one per SVT, and the licensed SVTs to ask. */
export function useMySvts(enabled = true) {
  return useQuery({
    queryKey: svtLinkKeys.mine(),
    queryFn: ({ signal }) => rfqApi.mySvts(signal),
    enabled,
  })
}

/** GET /svt/links: the bank's requests waiting, oldest first, then its linked traders. */
export function useSvtLinks(enabled = true) {
  return useQuery({
    queryKey: svtLinkKeys.bank(),
    queryFn: ({ signal }) => rfqApi.svtLinks(signal),
    enabled,
  })
}

function useRefreshLinks() {
  const queryClient = useQueryClient()
  return () => void queryClient.invalidateQueries({ queryKey: svtLinkKeys.all })
}

/** POST /me/svt: asks an SVT for a link; its bank's SVT accounts are told by e-mail and on TRD. */
export function useRequestSvt() {
  const refresh = useRefreshLinks()
  return useMutation({ mutationFn: rfqApi.requestSvt, onSuccess: refresh })
}

/** DELETE /me/svt/{svtId}: the link in force with that SVT, confirmed or waiting, is withdrawn. */
export function useRemoveSvt() {
  const refresh = useRefreshLinks()
  return useMutation({ mutationFn: rfqApi.removeSvt, onSuccess: refresh })
}

/** POST /svt/links/{linkId}/confirm, with the client's daily limit in XAF (null for none). */
export function useConfirmLink() {
  const refresh = useRefreshLinks()
  return useMutation({
    mutationFn: ({ linkId, dailyLimit }: { linkId: string; dailyLimit: number | null }) =>
      rfqApi.confirmLink(linkId, { dailyLimit }),
    onSuccess: refresh,
  })
}

/** POST /svt/links/{linkId}/decline */
export function useDeclineLink() {
  const refresh = useRefreshLinks()
  return useMutation({ mutationFn: rfqApi.declineLink, onSuccess: refresh })
}

/** POST /svt/links/{linkId}/revoke: a confirmed link is withdrawn by the SVT. */
export function useRevokeLink() {
  const refresh = useRefreshLinks()
  return useMutation({ mutationFn: rfqApi.revokeLink, onSuccess: refresh })
}

/** PUT /svt/links/{linkId}/limit: a confirmed client's daily limit, XAF, null for none. */
export function useChangeLinkLimit() {
  const refresh = useRefreshLinks()
  return useMutation({
    mutationFn: ({ linkId, dailyLimit }: { linkId: string; dailyLimit: number | null }) =>
      rfqApi.changeLimit(linkId, { dailyLimit }),
    onSuccess: refresh,
  })
}
