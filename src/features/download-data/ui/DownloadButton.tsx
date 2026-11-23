import { Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useStartExport } from '@/entities/data-export'
import type { ExportSettingsDto } from '@/shared/api/contracts'
import { Button } from '@/shared/ui/form/Button'
import { toast } from '@/shared/ui/toast'

interface DownloadButtonProps {
  /** Null while the settings lack a selection, a field or a period. */
  settings: ExportSettingsDto | null
}

/**
 * DL's Download (spec section 9, screen 30): a file up to 50,000 rows comes back at once and is
 * saved; above, the server prepares it and "My downloads" shows its progress until ExportReady.
 * A refusal (the profile's limits, an item unknown) is said as the server words it.
 */
export function DownloadButton({ settings }: DownloadButtonProps) {
  const { t } = useTranslation()
  const start = useStartExport()

  return (
    <Button
      variant="primary"
      icon={Download}
      busy={start.isPending}
      disabled={settings === null}
      className="min-w-60"
      onClick={() => {
        if (!settings) return
        start.mutate(settings, {
          onSuccess: (started) =>
            started.status === 'ready'
              ? toast.success(t('downloads.downloaded', { file: started.fileName ?? '' }))
              : toast.info(t('downloads.queued')),
          onError: (error) => toast.error(error.message),
        })
      }}
    >
      {t('downloads.download')}
    </Button>
  )
}
