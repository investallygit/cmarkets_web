import { CircleCheck } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { passwordIssues, useChangePassword } from '@/entities/session'
import { isApiError } from '@/shared/api'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { PasswordInput } from '@/shared/ui/form/PasswordInput'

const EMPTY = { current: '', next: '', confirmation: '' }

/** PUT /me/password: the current password, then the new one twice. Other devices log in again. */
export function PasswordForm() {
  const { t } = useTranslation()
  const change = useChangePassword()
  const [form, setForm] = useState(EMPTY)
  const [submitted, setSubmitted] = useState(false)
  const set = (patch: Partial<typeof EMPTY>) => {
    change.reset()
    setForm((current) => ({ ...current, ...patch }))
  }

  const serverErrors = isApiError(change.error, 400) ? (change.error.problem.errors ?? {}) : {}
  const weak = submitted && passwordIssues(form.next).length > 0
  const mismatch = submitted && form.confirmation !== form.next

  return (
    <form
      noValidate
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (passwordIssues(form.next).length > 0 || form.confirmation !== form.next) return
        change.mutate(
          { currentPassword: form.current, newPassword: form.next },
          {
            onSuccess: () => {
              setForm(EMPTY)
              setSubmitted(false)
            },
          },
        )
      }}
    >
      <div className="grid grid-cols-3 gap-2">
        <Field
          label={t('settings.security.currentPassword')}
          error={serverErrors.currentPassword?.[0] && t('settings.security.wrongPassword')}
        >
          <PasswordInput
            value={form.current}
            onChange={(current) => set({ current })}
            autoComplete="current-password"
          />
        </Field>
        <Field
          label={t('auth.reset.newPassword')}
          error={weak ? t('auth.signUp.errors.password') : serverErrors.newPassword?.[0]}
        >
          <PasswordInput
            value={form.next}
            onChange={(next) => set({ next })}
            autoComplete="new-password"
          />
        </Field>
        <Field
          label={t('auth.confirmPassword')}
          error={mismatch ? t('auth.signUp.errors.mismatch') : null}
        >
          <PasswordInput
            value={form.confirmation}
            onChange={(confirmation) => set({ confirmation })}
            autoComplete="new-password"
          />
        </Field>
      </div>
      {change.error && !isApiError(change.error, 400) && (
        <p role="alert" className="font-sans text-data text-down">
          {change.error.message}
        </p>
      )}
      <div className="flex items-center justify-between gap-3">
        <span className="font-sans text-title text-secondary">{t('auth.passwordRule')}</span>
        <div className="flex shrink-0 items-center gap-3">
          {change.isSuccess && (
            <span
              role="status"
              className="inline-flex items-center gap-1 font-sans text-data text-up"
            >
              <CircleCheck aria-hidden className="size-3.5" />
              {t('settings.security.passwordChanged')}
            </span>
          )}
          <Button type="submit" busy={change.isPending} disabled={!form.current || !form.next}>
            {t('settings.security.changePassword')}
          </Button>
        </div>
      </div>
    </form>
  )
}
