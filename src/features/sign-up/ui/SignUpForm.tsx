import { clsx } from 'clsx'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { OtpForm, useLogin, useRegister } from '@/entities/session'
import { isApiError } from '@/shared/api'
import { CLIENT_ACCOUNT_TYPES, type OtpChallengeDto } from '@/shared/api/contracts'
import { useLocale } from '@/shared/i18n'
import { routes } from '@/shared/routes/paths'
import { Button } from '@/shared/ui/form/Button'
import { Checkbox } from '@/shared/ui/form/Checkbox'
import { Field } from '@/shared/ui/form/Field'
import { FileDrop } from '@/shared/ui/form/FileDrop'
import { PasswordInput } from '@/shared/ui/form/PasswordInput'
import { TextInput } from '@/shared/ui/form/TextInput'
import {
  documentsFor,
  EMPTY_SIGN_UP,
  signUpIssues,
  toFormData,
  type SignUpField,
  type SignUpForm as Form,
} from '../lib/signUpForm'

const DOCUMENT_TYPES = '.pdf,.png,.jpg,.jpeg'
const DOCUMENT_MAX_SIZE = 5 * 1024 * 1024

/**
 * Sign-up (spec section 12): the account type, the user, the documents of a Student or an
 * Analyst, the terms; then the code sent to the address confirms it and opens the free trial.
 */
export function SignUpForm() {
  const { t } = useTranslation()
  const language = useLocale()
  const navigate = useNavigate()
  const register = useRegister()
  const login = useLogin()
  const [form, setForm] = useState<Form>(EMPTY_SIGN_UP)
  const [submitted, setSubmitted] = useState(false)
  const [challenge, setChallenge] = useState<OtpChallengeDto | null>(null)
  const set = (patch: Partial<Form>) => setForm((current) => ({ ...current, ...patch }))

  if (challenge) {
    return (
      <OtpForm
        challenge={challenge}
        // The account exists now: a new code comes from a login.
        onResend={() =>
          login.mutate({ email: form.email, password: form.password }, { onSuccess: setChallenge })
        }
        resending={login.isPending}
        onBack={() => navigate(routes.login)}
      />
    )
  }

  const issues = submitted ? signUpIssues(form) : {}
  const serverErrors = isApiError(register.error, 400) ? (register.error.problem.errors ?? {}) : {}
  const errorOf = (field: SignUpField) => {
    const issue = issues[field]
    return issue ? t(`auth.signUp.errors.${issue}`) : (serverErrors[field]?.[0] ?? null)
  }
  const failure = register.error && !isApiError(register.error, 400) ? register.error.message : null

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (Object.keys(signUpIssues(form)).length > 0) return
        register.mutate(toFormData(form, language), { onSuccess: setChallenge })
      }}
    >
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 font-sans text-data text-secondary">
          {t('auth.signUp.accountType')}
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {CLIENT_ACCOUNT_TYPES.map((accountType) => (
            <label
              key={accountType}
              className={clsx(
                'flex cursor-pointer flex-col gap-0.5 border p-2 has-focus-visible:ring-1 has-focus-visible:ring-accent-amber',
                form.accountType === accountType
                  ? 'border-brand-green bg-brand-green/10'
                  : 'hover:bg-panel-header',
              )}
            >
              <input
                type="radio"
                name="accountType"
                value={accountType}
                checked={form.accountType === accountType}
                onChange={() => set({ accountType })}
                className="sr-only"
              />
              <span className="font-sans text-label font-semibold">
                {t(`accountTypes.${accountType}`)}
              </span>
              <span className="font-sans text-data text-secondary">
                {t(`auth.signUp.types.${accountType}`)}
              </span>
            </label>
          ))}
        </div>
        {errorOf('accountType') && (
          <p className="font-sans text-title text-down">{errorOf('accountType')}</p>
        )}
      </fieldset>

      <Field label={t('auth.signUp.name')} error={errorOf('displayName')}>
        <TextInput
          value={form.displayName}
          onChange={(displayName) => set({ displayName })}
          autoComplete="name"
        />
      </Field>
      <Field label={t('auth.email')} error={errorOf('email')}>
        <TextInput
          type="email"
          value={form.email}
          onChange={(email) => set({ email })}
          autoComplete="email"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('auth.password')} hint={t('auth.passwordRule')} error={errorOf('password')}>
          <PasswordInput
            value={form.password}
            onChange={(password) => set({ password })}
            autoComplete="new-password"
          />
        </Field>
        <Field label={t('auth.confirmPassword')} error={errorOf('confirmPassword')}>
          <PasswordInput
            value={form.confirmPassword}
            onChange={(confirmPassword) => set({ confirmPassword })}
            autoComplete="new-password"
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field
          label={t('auth.signUp.phone')}
          hint={t('auth.signUp.phoneHint')}
          error={errorOf('phone')}
        >
          <TextInput
            type="tel"
            value={form.phone}
            onChange={(phone) => set({ phone })}
            autoComplete="tel"
            placeholder="+237 6 70 12 34 56"
            mono
          />
        </Field>
        <Field
          label={t('auth.signUp.organization')}
          hint={t('auth.signUp.organizationHint')}
          error={errorOf('organizationName')}
        >
          <TextInput
            value={form.organizationName}
            onChange={(organizationName) => set({ organizationName })}
            autoComplete="organization"
          />
        </Field>
      </div>

      {form.accountType === 'student' && (
        <p className="font-sans text-data text-secondary">{t('auth.signUp.studentNote')}</p>
      )}
      {form.accountType === 'analyst' && (
        <p className="font-sans text-data text-secondary">{t('auth.signUp.analystNote')}</p>
      )}
      {documentsFor(form.accountType).map(({ kind, required }) => (
        <Field
          key={kind}
          label={
            required
              ? t(`auth.signUp.documents.${kind}`)
              : t('auth.signUp.optional', { label: t(`auth.signUp.documents.${kind}`) })
          }
          error={errorOf(kind)}
        >
          <FileDrop
            file={form.documents[kind] ?? null}
            onChange={(file) =>
              set({ documents: { ...form.documents, [kind]: file ?? undefined } })
            }
            accept={DOCUMENT_TYPES}
            maxSize={DOCUMENT_MAX_SIZE}
          />
        </Field>
      ))}

      <div className="flex flex-col gap-1">
        <Checkbox
          checked={form.acceptTerms}
          onChange={(acceptTerms) => set({ acceptTerms })}
          label={t('auth.signUp.terms')}
          highlight={submitted && !form.acceptTerms}
        />
        {errorOf('acceptTerms') && (
          <p className="font-sans text-title text-down">{errorOf('acceptTerms')}</p>
        )}
      </div>
      {failure && (
        <p role="alert" className="font-sans text-label text-down">
          {failure}
        </p>
      )}
      <Button type="submit" variant="brand" size="lg" busy={register.isPending}>
        {t('auth.signUp.submit')}
      </Button>
      <p className="text-center font-sans text-label text-secondary">
        {t('auth.signUp.haveAccount')}{' '}
        <Link to={routes.login} className="text-info hover:underline">
          {t('auth.signUp.logIn')}
        </Link>
      </p>
    </form>
  )
}
