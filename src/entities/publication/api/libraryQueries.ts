import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  ContentReportDto,
  LibraryPublicationDto,
  LibrarySort,
  PaymentDto,
  PublicationAccess,
  PublicationRating,
  PurchaseRequestDto,
  SubjectType,
} from '@/shared/api/contracts'
import { researchApi, subscriptionsApi } from '@/shared/api/endpoints'
import { toast } from '@/shared/ui/toast'
import type { LibraryTab } from '../config/research'
import { usePendingPurchases } from '../model/pendingPurchases'

/** The filters of screen 8, the ANA tab of a security, and the page of the list. */
export interface LibraryQuery {
  tab: LibraryTab
  subjectType?: SubjectType
  subjectId?: string
  country?: string
  sector?: string
  access?: PublicationAccess
  rating?: PublicationRating
  sort?: LibrarySort
  q?: string
  /** One analyst's publications: their profile in NET, "View their publications". */
  analystId?: string
  page: number
  pageSize: number
}

export const libraryKeys = {
  all: ['library'] as const,
  lists: () => [...libraryKeys.all, 'list'] as const,
  list: (query: LibraryQuery) => [...libraryKeys.lists(), query] as const,
  detail: (id: string) => [...libraryKeys.all, 'detail', id] as const,
  payment: (id: string) => [...libraryKeys.all, 'payment', id] as const,
}

/** A pending payment is asked for its status this often until the provider answers. */
const PAYMENT_POLL_MS = 1500

/** GET /library; the Purchased tab reads GET /me/purchases with the same filters. */
export function useLibrary(query: LibraryQuery) {
  const { tab, ...filters } = query
  return useQuery({
    queryKey: libraryKeys.list(query),
    queryFn: ({ signal }) => {
      const read = tab === 'purchased' ? researchApi.purchases : researchApi.library
      return read({ ...filters, followed: tab === 'followed' || undefined }, signal)
    },
    placeholderData: keepPreviousData,
  })
}

/** GET /library/{id}: the preview, or the full content when the user may read it. */
export function useLibraryPublication(id: string | null | undefined) {
  return useQuery({
    queryKey: libraryKeys.detail(id ?? ''),
    queryFn: ({ signal }) => researchApi.libraryPublication(id ?? '', signal),
    enabled: Boolean(id),
  })
}

/** POST /library/{id}/purchase: starts a payment by mobile money or card. */
export function usePurchase(publicationId: string) {
  return useMutation({
    mutationFn: (request: PurchaseRequestDto) => researchApi.purchase(publicationId, request),
  })
}

/**
 * GET /payments/{id}, asked again while pending; once confirmed, the publication opens with its
 * full content and the lists show it bought.
 */
export function usePayment(payment: PaymentDto | null) {
  return useQuery(paymentQuery(payment))
}

/** The status of a payment, asked again while the provider has not answered. */
function paymentQuery(payment: PaymentDto | null) {
  return {
    queryKey: libraryKeys.payment(payment?.id ?? ''),
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      subscriptionsApi.payment(payment?.id ?? '', signal),
    enabled: Boolean(payment),
    initialData: payment ?? undefined,
    refetchInterval: (current: { state: { data?: PaymentDto } }) =>
      current.state.data?.status === 'pending' ? PAYMENT_POLL_MS : false,
    staleTime: 0,
  }
}

/**
 * Follows each purchase started (`usePendingPurchases`) to its end, whatever the reader opens
 * meanwhile (B65): once the payment is confirmed, the toast says the note is theirs and the note
 * and the lists are read again; a refused payment is said too. Mounted once by the app shell.
 */
export function usePurchaseFollowUp() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const purchases = usePendingPurchases((state) => state.purchases)
  const finish = usePendingPurchases((state) => state.finish)
  const pending = Object.entries(purchases).flatMap(([publicationId, purchase]) =>
    purchase ? [{ publicationId, ...purchase }] : [],
  )
  const payments = useQueries({ queries: pending.map(({ payment }) => paymentQuery(payment)) })
  const settled = pending.flatMap(({ publicationId, title }, index) => {
    const status = payments[index]?.data?.status
    return status === 'confirmed' || status === 'failed' ? [{ publicationId, title, status }] : []
  })
  const settledKey = settled.map(({ publicationId, status }) => `${publicationId}:${status}`).join()
  useEffect(() => {
    for (const { publicationId, title, status } of settled) {
      finish(publicationId)
      if (status === 'failed') {
        toast.error(t('purchase.failedTitle', { title }))
        continue
      }
      toast.success(t('purchase.confirmed', { title }))
      void queryClient.invalidateQueries({ queryKey: libraryKeys.detail(publicationId) })
      void queryClient.invalidateQueries({ queryKey: libraryKeys.lists() })
    }
    // settledKey names what `settled` holds.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settledKey])
}

/** POST /library/{id}/rating: 1 to 5 stars, the reader's again if rated before. */
export function useRatePublication(publicationId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (stars: number) => researchApi.rate(publicationId, stars),
    onSuccess: (result) => {
      queryClient.setQueryData<LibraryPublicationDto>(
        libraryKeys.detail(publicationId),
        (publication) => publication && { ...publication, ...result },
      )
      void queryClient.invalidateQueries({ queryKey: libraryKeys.lists() })
    },
  })
}

/** POST /library/{id}/report: for the moderators (screen 9). */
export function useReportPublication(publicationId: string) {
  return useMutation({
    mutationFn: (report: ContentReportDto) => researchApi.report(publicationId, report),
  })
}

/** GET /library/{id}/pdf: watermarked with the buyer's name. */
export function usePublicationPdf(publicationId: string) {
  return useMutation({
    mutationFn: (language: string) => researchApi.pdf(publicationId, language),
  })
}

/** The attachment of a publication the user may read. */
export function usePublicationAttachment(publicationId: string) {
  return useMutation({
    mutationFn: () => researchApi.libraryAttachment(publicationId),
  })
}
