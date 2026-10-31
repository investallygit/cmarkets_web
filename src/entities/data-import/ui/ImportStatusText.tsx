import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import type { ImportDto } from '@/shared/api/contracts'
import { importStatusLabel, type ImportStatusLabel } from '../config/importTypes'

const TONES: Record<ImportStatusLabel, string> = {
  format: 'text-warning',
  checks: 'text-warning',
  ready: 'text-accent-amber',
  published: 'text-up',
  republished: 'text-warning',
  rolledBack: 'text-down',
  discarded: 'text-secondary',
}

/** Published in green, being checked or rolled back and published again in yellow (screen 6). */
export function ImportStatusText({
  upload,
  className,
}: {
  upload: Pick<ImportDto, 'status' | 'rollback'>
  className?: string
}) {
  const { t } = useTranslation()
  const label = importStatusLabel(upload)
  return (
    <span className={clsx('font-mono', TONES[label], className)}>
      {t(`dataImport.status.${label}`)}
    </span>
  )
}
