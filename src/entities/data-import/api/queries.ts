import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type {
  CoverageDto,
  ImportDto,
  ImportRowDto,
  ImportRowPatchDto,
  ImportRowStatus,
  ImportStatus,
  ImportType,
  ImportTypeDto,
  Paged,
} from '@/shared/api/contracts'

export interface ImportQuery {
  status?: ImportStatus[]
  type?: ImportType
  /** Upload days, both included. */
  from?: string
  to?: string
  sessionDate?: string
  page?: number
  pageSize?: number
}

export const dataImportKeys = {
  all: ['data-imports'] as const,
  types: () => [...dataImportKeys.all, 'types'] as const,
  coverage: (date: string | null) => [...dataImportKeys.all, 'coverage', date] as const,
  lists: () => [...dataImportKeys.all, 'list'] as const,
  list: (query: ImportQuery) => [...dataImportKeys.lists(), query] as const,
  detail: (id: string) => [...dataImportKeys.all, 'detail', id] as const,
  rows: (id: string) => [...dataImportKeys.detail(id), 'rows'] as const,
  rowPage: (id: string, status: ImportRowStatus | null, page: number) =>
    [...dataImportKeys.rows(id), status, page] as const,
}

const importPath = (id: string, rest = '') => `/data/imports/${encodeURIComponent(id)}${rest}`

/** The checks are running: format, then business rules. */
export const isChecking = (status: ImportStatus) => status === 'format' || status === 'checks'

/** GET /data/import-types: the templates, which change with a release only. */
export function useImportTypes() {
  return useQuery({
    queryKey: dataImportKeys.types(),
    queryFn: ({ signal }) => apiClient.get<ImportTypeDto[]>('/data/import-types', { signal }),
    staleTime: Infinity,
  })
}

/** GET /data/coverage?date=: the session's files and where each stands; the current session by default. */
export function useCoverage(date: string | null = null) {
  return useQuery({
    queryKey: dataImportKeys.coverage(date),
    queryFn: ({ signal }) =>
      apiClient.get<CoverageDto>('/data/coverage', { query: { date }, signal }),
    placeholderData: keepPreviousData,
  })
}

/** GET /data/imports: the uploads, newest first. */
export function useImports(query: ImportQuery) {
  return useQuery({
    queryKey: dataImportKeys.list(query),
    queryFn: ({ signal }) =>
      apiClient.get<Paged<ImportDto>>('/data/imports', {
        query: { ...query, status: query.status },
        signal,
      }),
    placeholderData: keepPreviousData,
  })
}

/**
 * GET /data/imports/{id}. ImportStatusChanged reports the checks; the upload is also asked again
 * while they run, should the hub be away.
 */
export function useImport(id: string | null) {
  return useQuery({
    queryKey: dataImportKeys.detail(id ?? ''),
    queryFn: ({ signal }) => apiClient.get<ImportDto>(importPath(id ?? ''), { signal }),
    enabled: Boolean(id),
    refetchInterval: (query) =>
      query.state.data && isChecking(query.state.data.status) ? 1_000 : false,
  })
}

/** GET /data/imports/{id}/rows?status=: the rows of the preview, filtered by status. */
export function useImportRows(
  id: string | null,
  status: ImportRowStatus | null,
  page = 1,
  enabled = true,
) {
  return useQuery({
    queryKey: dataImportKeys.rowPage(id ?? '', status, page),
    queryFn: ({ signal }) =>
      apiClient.get<Paged<ImportRowDto>>(importPath(id ?? '', '/rows'), {
        query: { status, page, pageSize: 200 },
        signal,
      }),
    enabled: Boolean(id) && enabled,
    placeholderData: keepPreviousData,
  })
}

/** After a change of an upload: its rows, the history and the coverage. */
function useRefresh() {
  const queryClient = useQueryClient()
  return (dto: ImportDto) => {
    queryClient.setQueryData(dataImportKeys.detail(dto.id), dto)
    void queryClient.invalidateQueries({ queryKey: dataImportKeys.all })
  }
}

export interface UploadInput {
  type: ImportType
  sessionDate: string
  file: File
  /** Replace file: the upload not published yet that this one replaces. */
  replacesId?: string
}

/** POST /data/imports: the file goes up and its checks start. */
export function useUploadImport() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ type, sessionDate, file, replacesId }: UploadInput) => {
      const form = new FormData()
      form.set('type', type)
      form.set('sessionDate', sessionDate)
      form.set('file', file)
      if (replacesId) form.set('replacesId', replacesId)
      return apiClient.postForm<ImportDto>('/data/imports', form)
    },
    onSuccess: refresh,
  })
}

/** PATCH /data/imports/{id}/rows/{rowId}: Fix row, or the "Alert checked" tick. */
export function usePatchImportRow(importId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ rowId, patch }: { rowId: string; patch: ImportRowPatchDto }) =>
      apiClient.patch<ImportRowDto>(
        importPath(importId, `/rows/${encodeURIComponent(rowId)}`),
        patch,
      ),
    // The counters and the other rows change with a fix (a duplicate may end).
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dataImportKeys.detail(importId) }),
  })
}

/** POST /data/imports/{id}/publish */
export function usePublishImport() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (id: string) => apiClient.post<ImportDto>(importPath(id, '/publish')),
    onSuccess: refresh,
  })
}

/** POST /data/imports/{id}/rollback: the previous values come back. */
export function useRollBackImport() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient.post<ImportDto>(importPath(id, '/rollback'), { reason }),
    onSuccess: refresh,
  })
}

/** POST /data/imports/{id}/discard: an upload not published is dropped. */
export function useDiscardImport() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (id: string) => apiClient.post<ImportDto>(importPath(id, '/discard')),
    onSuccess: refresh,
  })
}

/** GET /data/import-types/{type}/template?format=: the empty template with an example line. */
export function useImportTemplate() {
  return useMutation({
    mutationFn: ({ type, format }: { type: ImportType; format: 'csv' | 'xlsx' }) =>
      apiClient.getBlob(`/data/import-types/${encodeURIComponent(type)}/template`, {
        query: { format },
      }),
  })
}
