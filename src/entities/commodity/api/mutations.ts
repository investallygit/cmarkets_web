import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { CommodityWriteDto } from '@/shared/api/contracts'
import { dataAdminApi } from '@/shared/api/endpoints'
import { commodityKeys } from './queries'

/** The security's queries, which hold its name and description too: their root key. */
const SECURITY_ROOT = ['securities'] as const

/**
 * CORR: a commodity's names, texts, CEMAC countries and related securities
 * (PUT /data/commodities/{code}); the screens read them again.
 */
export function useDescribeCommodity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ code, commodity }: { code: string; commodity: CommodityWriteDto }) =>
      dataAdminApi.describeCommodity(code, commodity),
    onSuccess: (profile) => {
      queryClient.setQueryData(commodityKeys.profile(profile.code), profile)
      void queryClient.invalidateQueries({ queryKey: commodityKeys.all })
      return queryClient.invalidateQueries({ queryKey: [...SECURITY_ROOT, profile.code] })
    },
  })
}
