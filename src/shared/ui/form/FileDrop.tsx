import { clsx } from 'clsx'
import { FileText, Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocale } from '@/shared/i18n'
import { formatFileSize } from '@/shared/lib/format'
import { useField } from './fieldContext'
import { describeAccept, isAccepted } from './fileAccept'

interface FileDropProps {
  file: File | null
  onChange: (file: File | null) => void
  /** Accepted extensions, e.g. ".csv,.xlsx". */
  accept?: string
  /** Largest accepted file, in bytes. */
  maxSize?: number
  disabled?: boolean
  className?: string
}

/**
 * Drag-and-drop zone that is also a file picker (data import, transaction import, attachments).
 * A file with another extension or above the size limit is refused with a message.
 */
export function FileDrop({ file, onChange, accept, maxSize, disabled, className }: FileDropProps) {
  const { t } = useTranslation()
  const locale = useLocale()
  const field = useField()
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  /** dragenter and dragleave also fire on the children of the zone. */
  const dragDepth = useRef(0)

  const pick = (candidate: File | undefined) => {
    if (!candidate) return
    if (accept && !isAccepted(candidate.name, accept)) {
      setError(t('form.fileTypeRejected', { name: candidate.name, types: describeAccept(accept) }))
    } else if (maxSize !== undefined && candidate.size > maxSize) {
      setError(
        t('form.fileTooLarge', { name: candidate.name, size: formatFileSize(maxSize, locale) }),
      )
    } else {
      setError(null)
      onChange(candidate)
    }
  }

  const limits = [
    accept && describeAccept(accept),
    maxSize !== undefined && t('form.maxFileSize', { size: formatFileSize(maxSize, locale) }),
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className={className}>
      <label
        onDragEnter={(event) => {
          event.preventDefault()
          if (disabled) return
          dragDepth.current += 1
          setDragging(true)
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => {
          dragDepth.current = Math.max(0, dragDepth.current - 1)
          if (dragDepth.current === 0) setDragging(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          dragDepth.current = 0
          setDragging(false)
          if (!disabled) pick(event.dataTransfer.files[0])
        }}
        className={clsx(
          'flex min-h-20 flex-col items-center justify-center gap-1 border border-dashed p-3 text-center',
          'has-focus-visible:border-accent-amber has-focus-visible:ring-1 has-focus-visible:ring-accent-amber/40',
          dragging ? 'border-accent-amber bg-accent-amber/5' : 'border-secondary/60',
          disabled ? 'opacity-50' : 'cursor-pointer hover:border-secondary',
        )}
      >
        <input
          type="file"
          accept={accept}
          disabled={disabled}
          id={field?.controlId}
          aria-describedby={field?.describedBy}
          onChange={(event) => {
            pick(event.target.files?.[0])
            // Lets the user pick the same file again after removing it.
            event.target.value = ''
          }}
          className="sr-only"
        />
        <Upload aria-hidden className="size-4 text-secondary" />
        <span className="font-sans text-data">{t('form.dropFile')}</span>
        {limits && <span className="font-sans text-title text-secondary">{limits}</span>}
      </label>
      {error && (
        <p role="alert" className="mt-1 font-sans text-title text-down">
          {error}
        </p>
      )}
      {file && (
        <div className="flex h-7 items-center gap-2 border border-t-0 px-2">
          <FileText aria-hidden className="size-3.5 shrink-0 text-secondary" />
          <span className="min-w-0 flex-1 truncate font-mono text-data">{file.name}</span>
          <span className="shrink-0 font-mono text-data text-secondary">
            {formatFileSize(file.size, locale)}
          </span>
          <button
            type="button"
            aria-label={t('form.removeFile')}
            disabled={disabled}
            onClick={() => onChange(null)}
            className="shrink-0 text-secondary hover:text-primary"
          >
            <X aria-hidden className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
