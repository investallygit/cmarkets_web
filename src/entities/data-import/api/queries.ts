import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  ImportDto,
  ImportRowPatchDto,
  ImportRowStatus,
  ImportStatus,
  ImportType,
} from '@/shared/api/contracts'
import { dataAdminApi, type ImportQuery, type UploadInput } from '@/shared/api/endpoints'

export type { ImportQuery, UploadInput }

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

/** The checks are running: format, then business rules. */
export const isChecking = (status: ImportStatus) => status === 'format' || status === 'checks'

/** GET /data/import-types: the templates, which change with a release only. */
export function useImportTypes() {
  return useQuery({
    queryKey: dataImportKeys.types(),
    queryFn: ({ signal }) => dataAdminApi.importTypes(signal),
    staleTime: Infinity,
  })
}

/** GET /data/coverage?date=: the session's files and where each stands; the current session by default. */
export function useCoverage(date: string | null = null) {
  return useQuery({
    queryKey: dataImportKeys.coverage(date),
    queryFn: ({ signal }) => dataAdminApi.coverage(date, signal),
    placeholderData: keepPreviousData,
  })
}

/** GET /data/imports: the uploads, newest first. */
export function useImports(query: ImportQuery) {
  return useQuery({
    queryKey: dataImportKeys.list(query),
    queryFn: ({ signal }) => dataAdminApi.imports(query, signal),
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
    queryFn: ({ signal }) => dataAdminApi.import(id ?? '', signal),
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
    queryFn: ({ signal }) => dataAdminApi.rows(id ?? '', { status, page, pageSize: 200 }, signal),
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

/** POST /data/imports: the file goes up and its checks start. */
export function useUploadImport() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (input: UploadInput) => dataAdminApi.upload(input),
    onSuccess: refresh,
  })
}

/** PATCH /data/imports/{id}/rows/{rowId}: Fix row, or the "Alert checked" tick. */
export function usePatchImportRow(importId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ rowId, patch }: { rowId: string; patch: ImportRowPatchDto }) =>
      dataAdminApi.patchRow(importId, rowId, patch),
    // The counters and the other rows change with a fix (a duplicate may end).
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dataImportKeys.detail(importId) }),
  })
}

/** POST /data/imports/{id}/publish */
export function usePublishImport() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: dataAdminApi.publish,
    onSuccess: refresh,
  })
}

/** POST /data/imports/{id}/rollback: the previous values come back. */
export function useRollBackImport() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      dataAdminApi.rollBack(id, reason),
    onSuccess: refresh,
  })
}

/** POST /data/imports/{id}/discard: an upload not published is dropped. */
export function useDiscardImport() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: dataAdminApi.discard,
    onSuccess: refresh,
  })
}

/** GET /data/import-types/{type}/template?format=: the empty template with an example line. */
export function useImportTemplate() {
  return useMutation({
    mutationFn: ({ type, format }: { type: ImportType; format: 'csv' | 'xlsx' }) =>
      dataAdminApi.template(type, format),
  })
}
