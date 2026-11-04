import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import {
  isVerifiedType,
  typesFor,
  useChangeAccountType,
  useResetTwoFactor,
  useSuspendAccount,
} from '@/entities/account'
import { useCurrentUser } from '@/entities/session'
import type { AccountType, AdminUserDetailsDto } from '@/shared/api/contracts'
import { auditLogPath } from '@/shared/routes/paths'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { Select } from '@/shared/ui/form/Select'
import { toast } from '@/shared/ui/toast'

type Asking = 'type' | 'mfa' | 'suspend' | null

/**
 * The actions of the account details (screen 9): Change type, Reset two-factor authentication,
 * View audit log, Suspend (reason required, confirmation) or Reactivate. An Admin does not change
 * or suspend their own account.
 */
export function AccountActions({ account }: { account: AdminUserDetailsDto }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const me = useCurrentUser()
  const resetMfa = useResetTwoFactor()
  const suspend = useSuspendAccount()
  const [asking, setAsking] = useState<Asking>(null)
  const self = account.id === me.id
  const suspended = account.status === 'suspended'
  const name = account.displayName
  const close = () => {
    resetMfa.reset()
    suspend.reset()
    setAsking(null)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        disabled={self}
        title={self ? t('accounts.actions.notSelf') : undefined}
        onClick={() => setAsking('type')}
      >
        {t('accounts.actions.changeType')}
      </Button>
      <Button onClick={() => setAsking('mfa')}>{t('accounts.actions.resetMfa')}</Button>
      <Button variant="info" onClick={() => void navigate(auditLogPath(account.id))}>
        {t('accounts.actions.auditLog')}
      </Button>
      <Button
        variant={suspended ? 'success' : 'danger'}
        disabled={self}
        title={self ? t('accounts.actions.notSelf') : undefined}
        onClick={() => setAsking('suspend')}
      >
        {suspended ? t('accounts.actions.reactivate') : t('accounts.actions.suspend')}
      </Button>

      <ChangeTypeDialog
        account={account}
        open={asking === 'type'}
        onClose={() => setAsking(null)}
      />
      <ConfirmDialog
        open={asking === 'mfa'}
        onClose={close}
        title={t('accounts.actions.resetMfaTitle')}
        message={
          <>
            {t('accounts.actions.resetMfaMessage', { name })}
            {resetMfa.error && (
              <span role="alert" className="mt-2 block text-down">
                {resetMfa.error.message}
              </span>
            )}
          </>
        }
        confirmLabel={t('accounts.actions.resetMfaConfirm')}
        busy={resetMfa.isPending}
        onConfirm={() =>
          resetMfa.mutate(account.id, {
            onSuccess: () => {
              toast.success(t('accounts.actions.resetMfaDone', { name }))
              setAsking(null)
            },
          })
        }
      />
      <ConfirmDialog
        open={asking === 'suspend'}
        onClose={close}
        title={
          suspended
            ? t('accounts.actions.reactivateTitle', { name })
            : t('accounts.actions.suspendTitle', { name })
        }
        message={
          <>
            {suspended
              ? t('accounts.actions.reactivateMessage')
              : t('accounts.actions.suspendMessage')}
            {suspend.error && (
              <span role="alert" className="mt-2 block text-down">
                {suspend.error.message}
              </span>
            )}
          </>
        }
        confirmLabel={suspended ? t('accounts.actions.reactivate') : t('accounts.actions.suspend')}
        tone={suspended ? 'primary' : 'danger'}
        requireReason
        busy={suspend.isPending}
        onConfirm={(reason) =>
          suspend.mutate(
            { id: account.id, suspend: !suspended, reason },
            {
              onSuccess: () => {
                toast.success(
                  suspended
                    ? t('accounts.actions.reactivated', { name })
                    : t('accounts.actions.suspended', { name }),
                )
                setAsking(null)
              },
            },
          )
        }
      />
    </div>
  )
}

interface ChangeTypeDialogProps {
  account: AdminUserDetailsDto
  open: boolean
  onClose: () => void
}

/** PUT /admin/users/{id}/type: a client among the client types, an employee among the others. */
function ChangeTypeDialog({ account, open, onClose }: ChangeTypeDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onClose={onClose} title={t('accounts.actions.changeTypeTitle')} width={400}>
      <ChangeTypeForm account={account} onClose={onClose} />
    </Dialog>
  )
}

/** Mounted with each opening, so the choice starts on the current type. */
function ChangeTypeForm({ account, onClose }: Omit<ChangeTypeDialogProps, 'open'>) {
  const { t } = useTranslation()
  const change = useChangeAccountType()
  const [accountType, setAccountType] = useState<AccountType>(account.accountType)
  const unchanged = accountType === account.accountType

  return (
    <form
      className="contents"
      onSubmit={(event) => {
        event.preventDefault()
        if (unchanged) return
        change.mutate(
          { id: account.id, accountType },
          {
            onSuccess: () => {
              toast.success(
                t('accounts.actions.typeChanged', {
                  name: account.displayName,
                  type: t(`accountTypes.${accountType}`),
                }),
              )
              onClose()
            },
          },
        )
      }}
    >
      <DialogBody>
        <p className="font-sans text-label">
          {t('accounts.actions.changeTypeMessage', { name: account.displayName })}
        </p>
        <Field label={t('settings.profile.accountType')}>
          <Select
            value={accountType}
            options={typesFor(account.accountType).map((value) => ({
              value,
              label: t(`accountTypes.${value}`),
            }))}
            onChange={setAccountType}
            highlight
          />
        </Field>
        {isVerifiedType(accountType) && !unchanged && (
          <p className="font-sans text-data text-secondary">
            {t('accounts.actions.toVerifiedNote', { type: t(`accountTypes.${accountType}`) })}
          </p>
        )}
        {change.error && (
          <p role="alert" className="font-sans text-data text-down">
            {change.error.message}
          </p>
        )}
      </DialogBody>
      <DialogFooter>
        <Button type="button" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" variant="primary" disabled={unchanged} busy={change.isPending}>
          {t('accounts.actions.changeType')}
        </Button>
      </DialogFooter>
    </form>
  )
}
