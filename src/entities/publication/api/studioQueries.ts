import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type {
  AttachmentDto,
  FrozenChartDto,
  FrozenChartRequestDto,
  MyPublicationDto,
  PayoutDto,
  PublicationCreateDto,
  PublicationDto,
  PublicationPricingUpdateDto,
  PublicationRulesDto,
  PublicationStatsDto,
  PublicationUpdateDto,
} from '@/shared/api/contracts'
import { libraryKeys } from './libraryQueries'

export const publicationKeys = {
  all: ['publications'] as const,
  mine: () => [...publicationKeys.all, 'mine'] as const,
  detail: (id: string) => [...publicationKeys.all, 'detail', id] as const,
  rules: () => [...publicationKeys.all, 'rules'] as const,
  stats: (from: string, to: string) => [...publicationKeys.all, 'stats', from, to] as const,
  payouts: () => [...publicationKeys.all, 'payouts'] as const,
}

const publicationPath = (id: string, suffix = '') =>
  `/publications/${encodeURIComponent(id)}${suffix}`

/** GET /me/publications: the analyst's own, newest change first. */
export function useMyPublications() {
  return useQuery({
    queryKey: publicationKeys.mine(),
    queryFn: ({ signal }) => apiClient.get<MyPublicationDto[]>('/me/publications', { signal }),
  })
}

/** GET /publications/{id}: the working copy, also fetched to replace a draft saved elsewhere. */
export function publicationQueryOptions(id: string) {
  return {
    queryKey: publicationKeys.detail(id),
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      apiClient.get<PublicationDto>(publicationPath(id), { signal }),
  }
}

/** The editor holds the user's changes, so the working copy is not fetched again behind its back. */
export function usePublication(id: string | null | undefined) {
  return useQuery({
    ...publicationQueryOptions(id ?? ''),
    enabled: Boolean(id),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
}

/** GET /publications/rules: the price range, the commission and the moderation mode. */
export function usePublicationRules() {
  return useQuery({
    queryKey: publicationKeys.rules(),
    queryFn: ({ signal }) => apiClient.get<PublicationRulesDto>('/publications/rules', { signal }),
    staleTime: Infinity,
  })
}

/** GET /me/publications/stats?from=&to= */
export function usePublicationStats(from: string, to: string) {
  return useQuery({
    queryKey: publicationKeys.stats(from, to),
    queryFn: ({ signal }) =>
      apiClient.get<PublicationStatsDto>('/me/publications/stats', {
        query: { from, to },
        signal,
      }),
  })
}

/** GET /me/payouts: one statement a month. */
export function usePayouts() {
  return useQuery({
    queryKey: publicationKeys.payouts(),
    queryFn: ({ signal }) => apiClient.get<PayoutDto[]>('/me/payouts', { signal }),
  })
}

/** After a change: the working copy as saved, the list of the studio and, once out, the library. */
function useStore() {
  const queryClient = useQueryClient()
  return (publication: PublicationDto, { library = false } = {}) => {
    queryClient.setQueryData(publicationKeys.detail(publication.id), publication)
    void queryClient.invalidateQueries({ queryKey: publicationKeys.mine() })
    if (library) void queryClient.invalidateQueries({ queryKey: libraryKeys.all })
  }
}

/** POST /publications: a draft on a company or a country. */
export function useCreatePublication() {
  const store = useStore()
  return useMutation({
    mutationFn: (input: PublicationCreateDto) =>
      apiClient.post<PublicationDto>('/publications', input),
    onSuccess: (created) => store(created),
  })
}

/** PUT /publications/{id}: the autosave; a 409 means the copy was saved elsewhere. */
export function useSavePublication() {
  const store = useStore()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PublicationUpdateDto }) =>
      apiClient.put<PublicationDto>(publicationPath(id), input),
    onSuccess: (saved) => store(saved),
  })
}

/** PUT /publications/{id}/pricing: once published, readers get the new price at once. */
export function useSavePricing() {
  const store = useStore()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PublicationPricingUpdateDto }) =>
      apiClient.put<PublicationDto>(publicationPath(id, '/pricing'), input),
    onSuccess: (saved) => store(saved, { library: saved.versions.length > 0 }),
  })
}

/** POST /publications/{id}/submit, /versions or /archive: the steps of the lifecycle. */
export function usePublicationStep(id: string) {
  const store = useStore()
  return useMutation({
    mutationFn: (step: { kind: 'submit' | 'versions' } | { kind: 'archive'; reason: string }) =>
      apiClient.post<PublicationDto>(
        publicationPath(id, `/${step.kind}`),
        step.kind === 'archive' ? { reason: step.reason } : undefined,
      ),
    onSuccess: (saved) => store(saved, { library: true }),
  })
}

/** POST /publications/{id}/charts: the chart's data is copied as of today. */
export function useFreezeChart(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: FrozenChartRequestDto) =>
      apiClient.post<FrozenChartDto>(publicationPath(id, '/charts'), request),
    onSuccess: (chart) =>
      queryClient.setQueryData<PublicationDto>(
        publicationKeys.detail(id),
        (publication) => publication && { ...publication, charts: [...publication.charts, chart] },
      ),
  })
}

/** POST /publications/{id}/attachments: an image of the body, or the PDF attachment. */
export function useUploadAttachment(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return apiClient.postForm<AttachmentDto>(publicationPath(id, '/attachments'), form)
    },
    onSuccess: (attachment) => {
      if (attachment.contentType !== 'application/pdf') return
      queryClient.setQueryData<PublicationDto>(
        publicationKeys.detail(id),
        (publication) => publication && { ...publication, attachment },
      )
    },
  })
}

export function useRemoveAttachment(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (attachmentId: string) =>
      apiClient.delete<void>(
        publicationPath(id, `/attachments/${encodeURIComponent(attachmentId)}`),
      ),
    onSuccess: () =>
      queryClient.setQueryData<PublicationDto>(
        publicationKeys.detail(id),
        (publication) => publication && { ...publication, attachment: null },
      ),
  })
}
