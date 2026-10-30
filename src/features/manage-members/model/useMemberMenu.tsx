import { ShieldCheck, UserMinus, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRemoveMember, useUpdateMember } from '@/entities/organization'
import type { OrganizationMemberDto } from '@/shared/api/contracts'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import type { MenuItem } from '@/shared/ui/menu'

/**
 * The right-click menu of a member for an administrator: administrator or member, then remove (or
 * withdraw an invitation) after a confirmation. One's own row has no menu.
 */
export function useMemberMenu(canManage: boolean) {
  const { t } = useTranslation()
  const update = useUpdateMember()
  const remove = useRemoveMember()
  const [removing, setRemoving] = useState<OrganizationMemberDto | null>(null)

  const menuOf = (member: OrganizationMemberDto): MenuItem[] => {
    if (!canManage || member.isSelf) return []
    const role: MenuItem =
      member.role === 'admin'
        ? {
            id: 'make-member',
            label: t('organization.makeMember'),
            icon: UserRound,
            onSelect: () => update.mutate({ id: member.id, update: { role: 'member' } }),
          }
        : {
            id: 'make-admin',
            label: t('organization.makeAdmin'),
            icon: ShieldCheck,
            onSelect: () => update.mutate({ id: member.id, update: { role: 'admin' } }),
          }
    return [
      role,
      {
        id: 'remove',
        label: member.status === 'invited' ? t('organization.withdraw') : t('organization.remove'),
        icon: UserMinus,
        onSelect: () => setRemoving(member),
      },
    ]
  }

  const name = removing?.displayName ?? removing?.email ?? ''
  const dialog = (
    <ConfirmDialog
      open={removing !== null}
      onClose={() => setRemoving(null)}
      title={removing?.status === 'invited' ? t('organization.withdraw') : t('organization.remove')}
      message={
        removing?.status === 'invited'
          ? t('organization.withdrawMessage', { email: removing.email })
          : t('organization.removeMessage', { name })
      }
      confirmLabel={
        removing?.status === 'invited' ? t('organization.withdraw') : t('organization.remove')
      }
      tone="danger"
      busy={remove.isPending}
      onConfirm={() => {
        if (removing) remove.mutate(removing.id, { onSuccess: () => setRemoving(null) })
      }}
    />
  )

  return { menuOf, dialog, error: update.error ?? remove.error }
}
