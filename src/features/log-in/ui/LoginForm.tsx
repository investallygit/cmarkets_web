import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { OtpForm, useLogin } from '@/entities/session'
import { isApiError } from '@/shared/api'
import type { LoginRequestDto, OtpChallengeDto } from '@/shared/api/contracts'
import { env } from '@/shared/config/env'
import { routes } from '@/shared/routes/paths'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { PasswordInput } from '@/shared/ui/form/PasswordInput'
import { TextInput } from '@/shared/ui/form/TextInput'
import { DemoAccounts } from './DemoAccounts'

/**
 * Login (spec section 6): e-mail and password, then the one-time code sent by e-mail or SMS. The
 * page moves on once the session starts.
 */
export function LoginForm() {
  const { t } = useTranslation()
  const login = useLogin()
  const [credentials, setCredentials] = useState<LoginRequestDto>({ email: '', password: '' })
  const [challenge, setChallenge] = useState<OtpChallengeDto | null>(null)
  const submit = () => login.mutate(credentials, { onSuccess: setChallenge })

  if (challenge) {
    return (
      <OtpForm
        challenge={challenge}
        onResend={submit}
        resending={login.isPending}
        onBack={() => {
          setChallenge(null)
          login.reset()
        }}
      />
    )
  }

  function loginError(error: Error): string {
    if (isApiError(error, 401)) return t('auth.login.wrongCredentials')
    if (isApiError(error, 403)) return t('auth.login.suspended')
    if (isApiError(error, 429)) {
      const minutes = error.problem.retryAfterMinutes
      return typeof minutes === 'number'
        ? t('auth.login.locked', { count: minutes })
        : t('auth.login.tooManyAttempts')
    }
    return error.message
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <Field label={t('auth.email')}>
        <TextInput
          type="email"
          autoComplete="username"
          value={credentials.email}
          onChange={(email) => setCredentials({ ...credentials, email })}
          required
          autoFocus
        />
      </Field>
      <Field label={t('auth.password')}>
        <PasswordInput
          autoComplete="current-password"
          value={credentials.password}
          onChange={(password) => setCredentials({ ...credentials, password })}
          required
        />
      </Field>
      <Link
        to={routes.resetPassword}
        className="-mt-2 self-end font-sans text-data text-info hover:underline"
      >
        {t('auth.login.forgot')}
      </Link>
      {login.error && (
        <p role="alert" className="font-sans text-label text-down">
          {loginError(login.error)}
        </p>
      )}
      <Button type="submit" variant="brand" size="lg" busy={login.isPending}>
        {t('auth.login.submit')}
      </Button>
      <p className="text-center font-sans text-label text-secondary">
        {t('auth.login.noAccount')}{' '}
        <Link to={routes.signUp} className="text-info underline underline-offset-2">
          {t('auth.login.signUp')}
        </Link>
      </p>
      {env.devTools && <DemoAccounts onPick={setCredentials} />}
    </form>
  )
}
