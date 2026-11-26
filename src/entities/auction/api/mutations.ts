import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { PublicOfferInput } from '@/shared/api/contracts'
import { dataAdminApi } from '@/shared/api/endpoints'
import { auctionKeys } from './queries'

/** CORR: a public bond issue of APE entered or changed (sixth version); APE reads again. */
export function useSavePublicOffer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, offer }: { id: string | null; offer: PublicOfferInput }) =>
      dataAdminApi.savePublicOffer(id, offer),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: auctionKeys.all }),
  })
}

/** CORR: an issue entered by mistake removed. */
export function useDeletePublicOffer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => dataAdminApi.deletePublicOffer(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: auctionKeys.all }),
  })
}
