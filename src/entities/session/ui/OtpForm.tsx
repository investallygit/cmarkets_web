import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { isApiError } from '@/shared/api'
import type { OtpChallengeDto } from '@/shared/api/contracts'
import { env } from '@/shared/config/env'
import { useFormat } from '@/shared/i18n'
import { useNow } from '@/shared/lib/useNow'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { TextInput } from '@/shared/ui/form/TextInput'
import { useVerifyOtp } from '../api/auth'
import { PrototypeCode } from './PrototypeCode'

interface OtpFormProps {
  challenge: OtpChallengeDto
  /** A new code: the parent logs in again with the same e-mail and password. */
  onResend: () => void
  resending: boolean
  /** Back to the e-mail and password. */
  onBack: () => void
}

/**
 * Second step of a login or a sign-up (spec section 6): the one-time code sent by e-mail or SMS.
 * Once it is right, the session starts and the page moves on.
 */
export function OtpForm({ challenge, onResend, resending, onBack }: OtpFormProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const verify = useVerifyOtp()
  const [code, setCode] = useState('')
  const now = useNow(1000)
  const resendIn = Math.max(0, Math.ceil((Date.parse(challenge.resendAt) - now) / 1000))

  const error = verify.error && otpError(verify.error)
  function otpError(failure: Error): string {
    if (isApiError(failure, 410)) return t('auth.otp.expired')
    if (isApiError(failure, 429)) return t('auth.otp.tooManyAttempts')
    if (isApiError(failure, 400)) {
      const left = failure.problem.attemptsLeft
      return typeof left === 'number'
        ? t('auth.otp.wrongCodeLeft', { count: left })
        : t('auth.otp.wrongCode')
    }
    return failure.message
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        verify.mutate({ challengeId: challenge.challengeId, code })
      }}
    >
      <p className="font-sans text-label">
        {t(`auth.otp.sentTo.${challenge.channel}`, { destination: challenge.destination })}
      </p>
      <Field
        label={t('auth.otp.code')}
        hint={t('auth.otp.validUntil', { time: format.time(challenge.expiresAt) })}
        error={error}
      >
        <TextInput
          value={code}
          onChange={(value) => setCode(value.replace(/\D/g, '').slice(0, challenge.codeLength))}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={challenge.codeLength}
          autoFocus
          mono
          className="tracking-[0.4em]"
        />
      </Field>
      <Button
        type="submit"
        variant="brand"
        size="lg"
        busy={verify.isPending}
        disabled={code.length !== challenge.codeLength}
      >
        {t('auth.otp.verify')}
      </Button>
      <div className="flex items-center justify-between gap-3">
        <Button variant="link" onClick={onBack}>
          {t('auth.otp.back')}
        </Button>
        <Button
          variant="link"
          disabled={resendIn > 0 || resending}
          onClick={() => {
            verify.reset()
            setCode('')
            onResend()
          }}
        >
          {resendIn > 0 ? t('auth.otp.resendIn', { seconds: resendIn }) : t('auth.otp.resend')}
        </Button>
      </div>
      {env.devTools && (
        <PrototypeCode query={{ challengeId: challenge.challengeId }} onUse={setCode} />
      )}
    </form>
  )
}
