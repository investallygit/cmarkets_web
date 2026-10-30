import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useInviteMember } from '@/entities/organization'
import { isEmailAddress } from '@/entities/session'
import { isApiError } from '@/shared/api'
import type { OrganizationRole } from '@/shared/api/contracts'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { Select } from '@/shared/ui/form/Select'
import { TextInput } from '@/shared/ui/form/TextInput'

/** An invitation by e-mail (POST /organization/members), for the organisation's administrators. */
export function InviteMemberForm() {
  const { t } = useTranslation()
  const invite = useInviteMember()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<OrganizationRole>('member')
  const [submitted, setSubmitted] = useState(false)

  const invalid = submitted && !isEmailAddress(email)
  const error = invalid
    ? t('auth.signUp.errors.email')
    : invite.error &&
      (isApiError(invite.error, 409)
        ? t('organization.alreadyMember', { email: email.trim() })
        : (invite.error.message ?? null))

  return (
    <form
      noValidate
      className="grid grid-cols-[minmax(0,1fr)_8.5rem_auto] items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (!isEmailAddress(email)) return
        invite.mutate(
          { email: email.trim(), role },
          {
            onSuccess: () => {
              setEmail('')
              setSubmitted(false)
            },
          },
        )
      }}
    >
      <Field label={t('organization.inviteEmail')} error={error}>
        <TextInput
          type="email"
          value={email}
          onChange={(value) => {
            invite.reset()
            setEmail(value)
          }}
          placeholder={t('organization.invitePlaceholder')}
          highlight
        />
      </Field>
      <Field label={t('organization.role')}>
        <Select
          value={role}
          options={(['member', 'admin'] as const).map((value) => ({
            value,
            label: t(`organization.roles.${value}`),
          }))}
          onChange={setRole}
        />
      </Field>
      <Button type="submit" busy={invite.isPending} className={error ? 'mb-4' : undefined}>
        {t('organization.invite')}
      </Button>
    </form>
  )
}
