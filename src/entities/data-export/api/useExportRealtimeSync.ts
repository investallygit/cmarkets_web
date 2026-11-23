import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useRealtimeEvent } from '@/shared/realtime'
import { toast } from '@/shared/ui/toast'
import { exportKeys } from './queries'

/**
 * ExportReady: a file of DL prepared in the background is ready, or failed; "My downloads" reads
 * again and a toast says so on any screen. Mounted once by the app shell.
 */
export function useExportRealtimeSync() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  useRealtimeEvent('ExportReady', ({ status, fileName, rows }) => {
    void queryClient.invalidateQueries({ queryKey: exportKeys.list() })
    if (status === 'ready')
      toast.success(t('downloads.toast.ready', { file: fileName ?? '', count: rows }))
    else toast.error(t('downloads.toast.failed'))
  })
}
