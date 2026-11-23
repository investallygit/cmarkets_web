import type {
  ExportCatalogDto,
  ExportDto,
  ExportPreviewDto,
  ExportScheduleDto,
  ExportScheduleWriteDto,
  ExportSettingsDto,
  ExportStatus,
} from '../contracts'
import { answer, route, send, sendBlob } from './define'

/** DL, data download (screen 30, fifth version): CMarket.Api's Controllers/Exports. */
export const exportsRoutes = {
  catalog: route('GET', '/exports/catalog', answer<ExportCatalogDto>()),
  preview: route('POST', '/exports/preview', answer<ExportPreviewDto>()),
  start: route('POST', '/exports', answer<ExportDto>()),
  list: route('GET', '/exports', answer<ExportDto[]>()),
  get: route('GET', '/exports/{id}', answer<ExportDto>()),
  file: route('GET', '/exports/{id}/file', answer<Blob>()),
  delete: route('DELETE', '/exports/{id}'),
  schedules: route('GET', '/exports/schedules', answer<ExportScheduleDto[]>()),
  schedule: route('POST', '/exports/schedules', answer<ExportScheduleDto>()),
  unschedule: route('DELETE', '/exports/schedules/{id}'),
}

export const exportsApi = {
  /** The datasets the profile downloads, and "My limits". */
  catalog: (signal?: AbortSignal) => send(exportsRoutes.catalog, { signal }),
  /** The first 10 rows and the estimate; the day's count untouched. */
  preview: (settings: ExportSettingsDto, signal?: AbortSignal) =>
    send(exportsRoutes.preview, { body: settings, signal }),
  /** Ready at once up to 50,000 rows; in progress above, ExportReady telling when it is done. */
  start: (settings: ExportSettingsDto) => send(exportsRoutes.start, { body: settings }),
  /** "My downloads": the last 7 days, and those expired in the 7 before. */
  list: (status?: ExportStatus, signal?: AbortSignal) =>
    send(exportsRoutes.list, { query: { status }, signal }),
  get: (id: string, signal?: AbortSignal) => send(exportsRoutes.get, { params: { id }, signal }),
  /** 409 before it is ready, 410 once expired. */
  file: (id: string, signal?: AbortSignal) =>
    sendBlob(exportsRoutes.file, { params: { id }, signal }),
  delete: (id: string) => send(exportsRoutes.delete, { params: { id } }),
  /** The user's scheduled exports, the next run first. */
  schedules: (signal?: AbortSignal) => send(exportsRoutes.schedules, { signal }),
  /** Within the profile's number of scheduled exports. */
  schedule: (schedule: ExportScheduleWriteDto) => send(exportsRoutes.schedule, { body: schedule }),
  unschedule: (id: string) => send(exportsRoutes.unschedule, { params: { id } }),
}
