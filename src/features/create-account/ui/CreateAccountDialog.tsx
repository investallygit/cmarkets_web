import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { isEmployeeType, useCreateAccount, useOrganizations } from '@/entities/account'
import { isEmailAddress } from '@/entities/session'
import { isApiError } from '@/shared/api'
import {
  ACCOUNT_TYPES,
  type AccountType,
  type AdminUserDetailsDto,
  type UserLanguage,
} from '@/shared/api/contracts'
import { isPhoneNumber } from '@/shared/lib/phone'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { SegmentedControl } from '@/shared/ui/form/SegmentedControl'
import { Select } from '@/shared/ui/form/Select'
import { TextInput } from '@/shared/ui/form/TextInput'
import { toast } from '@/shared/ui/toast'

const LANGUAGE_NAMES: Record<UserLanguage, string> = { fr: 'Français', en: 'English' }
const CMARKET = 'org-cmarket'

interface CreateAccountDialogProps {
  open: boolean
  onClose: () => void
  onCreated: (account: AdminUserDetailsDto) => void
}

/**
 * "+ Create account" of screen 9 (POST /admin/users): any type, Data admin and Admin included,
 * which belong to CMarket and log in with a code every time (spec section 12).
 */
export function CreateAccountDialog({ open, onClose, onCreated }: CreateAccountDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onClose={onClose} title={t('accounts.create.title')} width={460}>
      <CreateAccountForm onClose={onClose} onCreated={onCreated} />
    </Dialog>
  )
}

/** Mounted with each opening, so the form starts empty. */
function CreateAccountForm({ onClose, onCreated }: Omit<CreateAccountDialogProps, 'open'>) {
  const { t } = useTranslation()
  const create = useCreateAccount()
  const organizations = useOrganizations()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [accountType, setAccountType] = useState<AccountType>('student')
  const [organizationId, setOrganizationId] = useState('')
  const [phone, setPhone] = useState('')
  const [language, setLanguage] = useState<UserLanguage>('fr')
  const [submitted, setSubmitted] = useState(false)
  const employee = isEmployeeType(accountType)

  const local: Record<string, string | null> = {
    displayName: displayName.trim().length < 2 ? t('accounts.create.errors.name') : null,
    email: isEmailAddress(email) ? null : t('auth.signUp.errors.email'),
    phone: phone.trim() && !isPhoneNumber(phone) ? t('auth.signUp.errors.phone') : null,
  }
  const server = isApiError(create.error, 400) ? (create.error.problem.errors ?? {}) : {}
  const error = (field: string) => (submitted && local[field]) || server[field]?.[0]
  const otherError =
    create.error && !isApiError(create.error, 400) ? create.error.message : undefined

  const organizationOptions = employee
    ? [{ value: CMARKET, label: 'CMarket' }]
    : [
        { value: '', label: t('accounts.independent') },
        ...(organizations.data ?? [])
          .filter((organization) => organization.id !== CMARKET)
          .map((organization) => ({ value: organization.id, label: organization.name })),
      ]

  return (
    <form
      noValidate
      className="contents"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (Object.values(local).some(Boolean)) return
        create.mutate(
          {
            displayName: displayName.trim(),
            email: email.trim(),
            accountType,
            organizationId: employee ? CMARKET : organizationId || null,
            phone: phone.trim() || null,
            language,
          },
          {
            onSuccess: (account) => {
              toast.success(t('accounts.create.done', { name: account.displayName }))
              onCreated(account)
            },
          },
        )
      }}
    >
      <DialogBody>
        <Field label={t('settings.profile.name')} error={error('displayName')}>
          <TextInput value={displayName} onChange={setDisplayName} highlight autoFocus />
        </Field>
        <Field label={t('settings.profile.email')} error={error('email')}>
          <TextInput type="email" value={email} onChange={setEmail} highlight />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('settings.profile.accountType')} error={error('accountType')}>
            <Select
              value={accountType}
              options={ACCOUNT_TYPES.map((value) => ({
                value,
                label: t(`accountTypes.${value}`),
              }))}
              onChange={setAccountType}
              highlight
            />
          </Field>
          <Field label={t('settings.profile.organization')} error={error('organizationId')}>
            <Select
              value={employee ? CMARKET : organizationId}
              options={organizationOptions}
              onChange={setOrganizationId}
              disabled={employee}
              highlight={!employee}
            />
          </Field>
        </div>
        <Field
          label={t('auth.signUp.optional', { label: t('settings.profile.phone') })}
          error={error('phone')}
        >
          <TextInput type="tel" value={phone} onChange={setPhone} highlight />
        </Field>
        <Field label={t('settings.profile.language')} group>
          <SegmentedControl
            value={language}
            options={(['fr', 'en'] as const).map((value) => ({
              value,
              label: LANGUAGE_NAMES[value],
            }))}
            onChange={setLanguage}
            aria-label={t('settings.profile.language')}
          />
        </Field>
        <ul className="flex list-disc flex-col gap-1 pl-4 font-sans text-data text-secondary">
          {employee && <li>{t('accounts.create.employeeNote')}</li>}
          {accountType === 'analyst' && <li>{t('accounts.create.analystNote')}</li>}
          <li>{t('accounts.create.invitationNote')}</li>
        </ul>
        {otherError && (
          <p role="alert" className="font-sans text-data text-down">
            {otherError}
          </p>
        )}
      </DialogBody>
      <DialogFooter>
        <Button type="button" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" variant="primary" busy={create.isPending}>
          {t('accounts.create.submit')}
        </Button>
      </DialogFooter>
    </form>
  )
}
