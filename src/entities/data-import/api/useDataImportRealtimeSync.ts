import { useQueryClient } from '@tanstack/react-query'
import { useRealtimeEvent } from '@/shared/realtime'
import { dataImportKeys } from './queries'

/**
 * ImportStatusChanged moves an upload through its checks; DataPublished (a publication, a
 * rollback, a correction) changes the coverage and the history. Mounted once by the app shell.
 */
export function useDataImportRealtimeSync() {
  const queryClient = useQueryClient()
  useRealtimeEvent('ImportStatusChanged', ({ importId }) => {
    void queryClient.invalidateQueries({ queryKey: dataImportKeys.detail(importId) })
    void queryClient.invalidateQueries({ queryKey: dataImportKeys.lists() })
  })
  useRealtimeEvent('DataPublished', () => {
    void queryClient.invalidateQueries({ queryKey: dataImportKeys.all })
  })
}
