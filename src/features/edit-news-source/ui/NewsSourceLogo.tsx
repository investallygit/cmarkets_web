import { ImageUp, X } from 'lucide-react'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useRemoveNewsSourceLogo, useUploadNewsSourceLogo } from '@/entities/news-source'
import type { AdminNewsSourceDto } from '@/shared/api/contracts'
import { resolveApiUrl } from '@/shared/config/env'
import { useFormat } from '@/shared/i18n'
import { Button } from '@/shared/ui/form/Button'
import { toast } from '@/shared/ui/toast'

const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const LOGO_MAX_BYTES = 512 * 1024

/**
 * The newspaper's logo, on the card of its tag (spec section 16; SRC keeps it, ROADMAP step 27):
 * a PNG, JPEG or WebP image of 512 KB at most, replaced or removed. Its address changes with it.
 */
export function NewsSourceLogo({ source }: { source: AdminNewsSourceDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const upload = useUploadNewsSourceLogo()
  const remove = useRemoveNewsSourceLogo()
  const input = useRef<HTMLInputElement>(null)

  const pick = (file: File) => {
    if (!LOGO_TYPES.includes(file.type)) {
      toast.error(t('form.fileTypeRejected', { name: file.name, types: 'PNG, JPEG, WebP' }))
      return
    }
    if (file.size > LOGO_MAX_BYTES) {
      toast.error(
        t('form.fileTooLarge', { name: file.name, size: format.fileSize(LOGO_MAX_BYTES) }),
      )
      return
    }
    upload.mutate(
      { id: source.id, file },
      {
        onSuccess: () => toast.success(t('newsSources.logoSaved')),
        onError: (error) => toast.error(error.message),
      },
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {source.logoUrl ? (
        <img
          src={resolveApiUrl(source.logoUrl)}
          alt={t('newsSources.logoAlt', { name: source.name })}
          className="size-12 shrink-0 border object-contain"
        />
      ) : (
        <span
          aria-hidden
          className="flex size-12 shrink-0 items-center justify-center border font-mono text-data text-secondary"
        >
          —
        </span>
      )}
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            icon={ImageUp}
            busy={upload.isPending}
            onClick={() => input.current?.click()}
          >
            {source.logoUrl ? t('newsSources.replaceLogo') : t('newsSources.uploadLogo')}
          </Button>
          {source.logoUrl && (
            <Button
              size="sm"
              icon={X}
              busy={remove.isPending}
              onClick={() =>
                remove.mutate(source.id, {
                  onSuccess: () => toast.success(t('newsSources.logoRemoved')),
                  onError: (error) => toast.error(error.message),
                })
              }
            >
              {t('newsSources.removeLogo')}
            </Button>
          )}
        </div>
        <p className="font-sans text-data text-secondary">{t('newsSources.logoHint')}</p>
      </div>
      <input
        ref={input}
        type="file"
        accept={LOGO_TYPES.join(',')}
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) pick(file)
        }}
      />
    </div>
  )
}
