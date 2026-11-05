import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { apiClient } from '@/shared/api'
import type {
  ContentReportDto,
  LibraryItemDto,
  LibraryPublicationDto,
  LibrarySort,
  Paged,
  PaymentDto,
  PublicationAccess,
  PublicationRating,
  PurchaseRequestDto,
  RatingResultDto,
  SubjectType,
} from '@/shared/api/contracts'
import type { LibraryTab } from '../config/research'

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

const libraryPath = (id: string, suffix = '') => `/library/${encodeURIComponent(id)}${suffix}`

/** A pending payment is asked for its status this often until the provider answers. */
const PAYMENT_POLL_MS = 1500

/** GET /library; the Purchased tab reads GET /me/purchases with the same filters. */
export function useLibrary(query: LibraryQuery) {
  const { tab, ...filters } = query
  return useQuery({
    queryKey: libraryKeys.list(query),
    queryFn: ({ signal }) =>
      apiClient.get<Paged<LibraryItemDto>>(tab === 'purchased' ? '/me/purchases' : '/library', {
        query: { ...filters, followed: tab === 'followed' || undefined },
        signal,
      }),
    placeholderData: keepPreviousData,
  })
}

/** GET /library/{id}: the preview, or the full content when the user may read it. */
export function useLibraryPublication(id: string | null | undefined) {
  return useQuery({
    queryKey: libraryKeys.detail(id ?? ''),
    queryFn: ({ signal }) =>
      apiClient.get<LibraryPublicationDto>(libraryPath(id ?? ''), { signal }),
    enabled: Boolean(id),
  })
}

/** POST /library/{id}/purchase: starts a payment by mobile money or card. */
export function usePurchase(publicationId: string) {
  return useMutation({
    mutationFn: (request: PurchaseRequestDto) =>
      apiClient.post<PaymentDto>(libraryPath(publicationId, '/purchase'), request),
  })
}

/**
 * GET /payments/{id}, asked again while pending; once confirmed, the publication opens with its
 * full content and the lists show it bought.
 */
export function usePayment(payment: PaymentDto | null) {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: libraryKeys.payment(payment?.id ?? ''),
    queryFn: ({ signal }) =>
      apiClient.get<PaymentDto>(`/payments/${encodeURIComponent(payment?.id ?? '')}`, { signal }),
    enabled: Boolean(payment),
    initialData: payment ?? undefined,
    refetchInterval: (current) =>
      current.state.data?.status === 'pending' ? PAYMENT_POLL_MS : false,
    staleTime: 0,
  })
  const status = query.data?.status
  const publicationId = payment?.publicationId
  useEffect(() => {
    if (status !== 'confirmed' || !publicationId) return
    void queryClient.invalidateQueries({ queryKey: libraryKeys.detail(publicationId) })
    void queryClient.invalidateQueries({ queryKey: libraryKeys.lists() })
  }, [status, publicationId, queryClient])
  return query
}

/** POST /library/{id}/rating: 1 to 5 stars, the reader's again if rated before. */
export function useRatePublication(publicationId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (stars: number) =>
      apiClient.post<RatingResultDto>(libraryPath(publicationId, '/rating'), { stars }),
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
    mutationFn: (report: ContentReportDto) =>
      apiClient.post<void>(libraryPath(publicationId, '/report'), report),
  })
}

/** GET /library/{id}/pdf: watermarked with the buyer's name. */
export function usePublicationPdf(publicationId: string) {
  return useMutation({
    mutationFn: (language: string) =>
      apiClient.getBlob(libraryPath(publicationId, '/pdf'), { query: { language } }),
  })
}

/** The attachment of a publication the user may read. */
export function usePublicationAttachment(publicationId: string) {
  return useMutation({
    mutationFn: () => apiClient.getBlob(libraryPath(publicationId, '/attachment')),
  })
}
