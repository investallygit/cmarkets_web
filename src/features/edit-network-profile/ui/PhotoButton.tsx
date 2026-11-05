import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PHOTO_MAX_BYTES, PHOTO_TYPES, useUploadProfilePhoto } from '@/entities/profile'
import { isApiError } from '@/shared/api'
import { Button } from '@/shared/ui/form/Button'
import { toast } from '@/shared/ui/toast'

/**
 * "Change photo": a JPEG or PNG of 2 MB at most, sent at once (POST /me/profile/photo); the
 * server keeps its centre, cropped square.
 */
export function PhotoButton() {
  const { t } = useTranslation()
  const input = useRef<HTMLInputElement>(null)
  const upload = useUploadProfilePhoto()
  const [error, setError] = useState<string | null>(null)

  const send = (file: File) => {
    if (!PHOTO_TYPES.includes(file.type)) return setError(t('network.profile.photoErrors.type'))
    if (file.size > PHOTO_MAX_BYTES) return setError(t('network.profile.photoErrors.size'))
    setError(null)
    upload.mutate(file, {
      onSuccess: () => toast.success(t('network.profile.photoSaved')),
      onError: (failure) =>
        setError(
          (isApiError(failure, 400) && failure.problem.errors?.photo?.[0]) || failure.message,
        ),
    })
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button variant="info" busy={upload.isPending} onClick={() => input.current?.click()}>
        {t('network.profile.changePhoto')}
      </Button>
      <input
        ref={input}
        type="file"
        accept={PHOTO_TYPES.join(',')}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) send(file)
        }}
      />
      <p role={error ? 'alert' : undefined} className="font-sans text-title text-secondary">
        {error ? <span className="text-down">{error}</span> : t('network.profile.photoHint')}
      </p>
    </div>
  )
}
