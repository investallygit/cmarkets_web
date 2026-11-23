import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ADMIN_QUERY_ROOT, useRefreshAdminData } from '@/shared/api/adminData'
import type {
  ExportAdminSettingsDto,
  ExportDto,
  ExportScheduleWriteDto,
  ExportSettingsDto,
} from '@/shared/api/contracts'
import { adminApi, exportsApi } from '@/shared/api/endpoints'
import { saveBlob } from '@/shared/lib/download'

/** Query keys of DL (screen 30): the catalogue and limits, the downloads, a preview. */
export const exportKeys = {
  all: ['exports'] as const,
  catalog: () => [...exportKeys.all, 'catalog'] as const,
  list: () => [...exportKeys.all, 'list'] as const,
  preview: (settings: ExportSettingsDto | null) =>
    [...exportKeys.all, 'preview', settings] as const,
  schedules: () => [...exportKeys.all, 'schedules'] as const,
  /** The Admin's: the download log and the settings of ADMCFG. */
  log: (query: { from?: string; to?: string; dataset?: string }) =>
    [...ADMIN_QUERY_ROOT, 'exports', 'log', query] as const,
  adminSettings: () => [...ADMIN_QUERY_ROOT, 'exports', 'settings'] as const,
}

/** GET /exports/catalog: the datasets the profile downloads, and "My limits". */
export function useExportCatalog() {
  return useQuery({
    queryKey: exportKeys.catalog(),
    queryFn: ({ signal }) => exportsApi.catalog(signal),
    staleTime: 60_000,
  })
}

/** GET /exports: "My downloads", read again every few seconds while one is in progress. */
export function useExports() {
  return useQuery({
    queryKey: exportKeys.list(),
    queryFn: ({ signal }) => exportsApi.list(undefined, signal),
    refetchInterval: (query) =>
      query.state.data?.some((item) => item.status === 'inProgress') ? 5_000 : false,
  })
}

/** POST /exports/preview for settings complete enough; the last preview stays while the next loads. */
export function useExportPreview(settings: ExportSettingsDto | null) {
  return useQuery({
    queryKey: exportKeys.preview(settings),
    queryFn: ({ signal }) => exportsApi.preview(settings as ExportSettingsDto, signal),
    enabled: settings !== null,
    placeholderData: keepPreviousData,
    retry: false,
    staleTime: 60_000,
  })
}

/** Saves a ready file under its name. */
export async function downloadExportFile(item: Pick<ExportDto, 'id' | 'fileName'>) {
  const blob = await exportsApi.file(item.id)
  saveBlob(blob, item.fileName ?? `${item.id}.csv`)
}

function useRefreshExports() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: exportKeys.list() })
    void queryClient.invalidateQueries({ queryKey: exportKeys.catalog() })
  }
}

/**
 * POST /exports: a file ready at once up to 50,000 rows, saved as it comes back; above, prepared
 * in the background, ExportReady telling when it is done.
 */
export function useStartExport() {
  const refresh = useRefreshExports()
  return useMutation({
    mutationFn: async (settings: ExportSettingsDto) => {
      const started = await exportsApi.start(settings)
      if (started.status === 'ready') await downloadExportFile(started)
      return started
    },
    onSettled: refresh,
  })
}

/** DELETE /exports/{id}: the file removed; the download stays in the log. */
export function useDeleteExport() {
  const refresh = useRefreshExports()
  return useMutation({ mutationFn: exportsApi.delete, onSuccess: refresh })
}

/** GET /exports/schedules: the user's scheduled exports. */
export function useExportSchedules() {
  return useQuery({
    queryKey: exportKeys.schedules(),
    queryFn: ({ signal }) => exportsApi.schedules(signal),
  })
}

function useRefreshSchedules() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: exportKeys.schedules() })
    void queryClient.invalidateQueries({ queryKey: exportKeys.catalog() })
  }
}

/** POST /exports/schedules: within the profile's number of scheduled exports. */
export function useCreateExportSchedule() {
  const refresh = useRefreshSchedules()
  return useMutation({
    mutationFn: (schedule: ExportScheduleWriteDto) => exportsApi.schedule(schedule),
    onSuccess: refresh,
  })
}

/** DELETE /exports/schedules/{id}. */
export function useDeleteExportSchedule() {
  const refresh = useRefreshSchedules()
  return useMutation({ mutationFn: exportsApi.unschedule, onSuccess: refresh })
}

/** GET /admin/exports/log: the Admin's log of the downloads (USER). */
export function useExportLog(query: { from?: string; to?: string; dataset?: string }) {
  return useQuery({
    queryKey: exportKeys.log(query),
    queryFn: ({ signal }) => adminApi.exportLog(query, signal),
    placeholderData: keepPreviousData,
  })
}

/** GET /admin/exports/settings: the sources DL downloads and the profiles' limits (ADMCFG). */
export function useExportAdminSettings() {
  return useQuery({
    queryKey: exportKeys.adminSettings(),
    queryFn: ({ signal }) => adminApi.exportSettings(signal),
  })
}

/** PUT /admin/exports/settings, audited; the Admin's lists read again. */
export function useSaveExportAdminSettings() {
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: (settings: ExportAdminSettingsDto) => adminApi.saveExportSettings(settings),
    onSuccess: refresh,
  })
}
