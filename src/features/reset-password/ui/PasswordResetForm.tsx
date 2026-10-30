import { CircleCheck } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import {
  isEmailAddress,
  passwordIssues,
  PrototypeCode,
  useConfirmPasswordReset,
  useRequestPasswordReset,
} from '@/entities/session'
import { isApiError } from '@/shared/api'
import { env } from '@/shared/config/env'
import { routes } from '@/shared/routes/paths'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { PasswordInput } from '@/shared/ui/form/PasswordInput'
import { TextInput } from '@/shared/ui/form/TextInput'

/**
 * Password reset (POST /auth/password/reset): the address, then the code sent to it and the new
 * password. The answer is the same whether an account uses the address or not.
 */
export function PasswordResetForm() {
  const { t } = useTranslation()
  const request = useRequestPasswordReset()
  const confirm = useConfirmPasswordReset()
  const [email, setEmail] = useState('')
  const [sentAt, setSentAt] = useState<number | null>(null)
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const send = () =>
    request.mutate({ email: email.trim() }, { onSuccess: () => setSentAt(Date.now()) })

  if (confirm.isSuccess) {
    return (
      <div className="flex flex-col gap-4">
        <p role="status" className="flex items-start gap-2 font-sans text-label">
          <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-up" />
          {t('auth.reset.done')}
        </p>
        <Link to={routes.login} className="font-sans text-label text-info hover:underline">
          {t('auth.reset.toLogin')}
        </Link>
      </div>
    )
  }

  if (sentAt === null) {
    const invalid = submitted && !isEmailAddress(email)
    return (
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          setSubmitted(true)
          if (isEmailAddress(email)) send()
        }}
      >
        <p className="font-sans text-label text-secondary">{t('auth.reset.intro')}</p>
        <Field label={t('auth.email')} error={invalid ? t('auth.signUp.errors.email') : null}>
          <TextInput
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="username"
            autoFocus
          />
        </Field>
        {request.error && (
          <p role="alert" className="font-sans text-label text-down">
            {request.error.message}
          </p>
        )}
        <Button type="submit" variant="brand" size="lg" busy={request.isPending}>
          {t('auth.reset.send')}
        </Button>
        <Link to={routes.login} className="font-sans text-label text-info hover:underline">
          {t('auth.reset.toLogin')}
        </Link>
      </form>
    )
  }

  const passwordError = submitted && passwordIssues(password).length > 0
  const mismatch = submitted && confirmation !== password
  const error = confirm.error
  const serverPasswordError = isApiError(error, 400) ? error.problem.errors?.newPassword?.[0] : null
  let codeError: string | null = null
  if (isApiError(error, 410)) codeError = t('auth.otp.expired')
  else if (isApiError(error, 429)) codeError = t('auth.otp.tooManyAttempts')
  else if (isApiError(error, 400) && typeof error.problem.attemptsLeft === 'number') {
    codeError = t('auth.otp.wrongCodeLeft', { count: error.problem.attemptsLeft })
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (passwordIssues(password).length > 0 || confirmation !== password) return
        confirm.mutate({ email: email.trim(), code, newPassword: password })
      }}
    >
      <p className="font-sans text-label">{t('auth.reset.sent', { email: email.trim() })}</p>
      <Field label={t('auth.otp.code')} error={codeError}>
        <TextInput
          value={code}
          onChange={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          mono
          className="tracking-[0.4em]"
        />
      </Field>
      <Field
        label={t('auth.reset.newPassword')}
        hint={t('auth.passwordRule')}
        error={passwordError ? t('auth.signUp.errors.password') : serverPasswordError}
      >
        <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" />
      </Field>
      <Field
        label={t('auth.confirmPassword')}
        error={mismatch ? t('auth.signUp.errors.mismatch') : null}
      >
        <PasswordInput
          value={confirmation}
          onChange={setConfirmation}
          autoComplete="new-password"
        />
      </Field>
      <Button
        type="submit"
        variant="brand"
        size="lg"
        busy={confirm.isPending}
        disabled={code.length !== 6}
      >
        {t('auth.reset.submit')}
      </Button>
      <Button
        variant="link"
        onClick={() => {
          confirm.reset()
          setCode('')
          send()
        }}
        disabled={request.isPending}
        className="self-start"
      >
        {t('auth.reset.again')}
      </Button>
      {env.useMocks && <PrototypeCode query={{ email: email.trim(), sentAt }} onUse={setCode} />}
    </form>
  )
}
