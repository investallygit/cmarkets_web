import { useQueryClient } from '@tanstack/react-query'
import { clsx } from 'clsx'
import { Fragment, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ACCOUNT_TYPE_COLORS } from '@/entities/account'
import { useSaveRolePermissions } from '@/entities/platform-settings'
import { sessionKeys } from '@/entities/session'
import { ACCOUNT_TYPES, type AccountType, type Permission } from '@/shared/api/contracts'
import {
  isLockedPermission,
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
} from '@/shared/config/permissions'
import { Button } from '@/shared/ui/form/Button'
import { Checkbox } from '@/shared/ui/form/Checkbox'
import { toast } from '@/shared/ui/toast'

type Matrix = Record<AccountType, Permission[]>

const has = (matrix: Matrix, role: AccountType, permission: Permission) =>
  matrix[role].includes(permission)

/**
 * The permission matrix of spec section 12: the permissions as rows, the account types as
 * columns (GET / PUT /admin/roles/{role}/permissions). The changes are saved together, one role
 * after the other; the Admin keeps the settings.
 */
export function PermissionMatrix({ permissions }: { permissions: Matrix }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const save = useSaveRolePermissions()
  const [draft, setDraft] = useState<Matrix>(permissions)
  const [saving, setSaving] = useState(false)

  const changedRoles = ACCOUNT_TYPES.filter(
    (role) => [...draft[role]].sort().join() !== [...permissions[role]].sort().join(),
  )
  const changes = ACCOUNT_TYPES.reduce(
    (total, role) =>
      total +
      PERMISSION_GROUPS.flatMap((group) => group.permissions).filter(
        (permission) => has(draft, role, permission) !== has(permissions, role, permission),
      ).length,
    0,
  )

  const toggle = (role: AccountType, permission: Permission, checked: boolean) =>
    setDraft((current) => ({
      ...current,
      [role]: checked
        ? [...current[role], permission]
        : current[role].filter((candidate) => candidate !== permission),
    }))

  const saveAll = async () => {
    setSaving(true)
    try {
      for (const role of changedRoles) {
        await save.mutateAsync({ role, permissions: draft[role] })
      }
      // The Admin's own permissions may have changed.
      await queryClient.invalidateQueries({ queryKey: sessionKeys.me })
      toast.success(t('permissions.saved', { count: changes }))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse font-sans text-data">
          <thead className="sticky top-0 z-1 bg-panel-header">
            <tr className="h-row border-b">
              <th scope="col" className="px-2 text-left font-normal text-secondary">
                {t('permissions.function')}
              </th>
              {ACCOUNT_TYPES.map((role) => (
                <th
                  key={role}
                  scope="col"
                  className="w-24 px-1 text-center font-semibold"
                  style={{ color: ACCOUNT_TYPE_COLORS[role] }}
                >
                  {t(`accountBadge.${role}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_GROUPS.map((group) => (
              <Fragment key={group.id}>
                <tr className="h-row border-b bg-row-alt">
                  <th
                    scope="colgroup"
                    colSpan={ACCOUNT_TYPES.length + 1}
                    className="px-2 text-left font-semibold tracking-title text-secondary uppercase"
                  >
                    {t(group.label)}
                  </th>
                </tr>
                {group.permissions.map((permission) => (
                  <tr key={permission} className="h-row border-b hover:bg-panel-header">
                    <th scope="row" className="px-2 text-left font-normal">
                      {t(PERMISSION_LABELS[permission])}
                      <span className="ml-2 font-mono text-caption text-secondary">
                        {permission}
                      </span>
                    </th>
                    {ACCOUNT_TYPES.map((role) => {
                      const checked = has(draft, role, permission)
                      const locked = isLockedPermission(role, permission)
                      return (
                        <td
                          key={role}
                          className={clsx(
                            'text-center',
                            checked !== has(permissions, role, permission) && 'bg-accent-amber/15',
                          )}
                          title={locked ? t('permissions.locked') : undefined}
                        >
                          <Checkbox
                            checked={checked}
                            disabled={locked || saving}
                            onChange={(value) => toggle(role, permission, value)}
                            aria-label={`${t(PERMISSION_LABELS[permission])}, ${t(`accountTypes.${role}`)}`}
                            className="justify-center"
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <footer className="flex shrink-0 items-center gap-2 border-t px-3 py-2">
        <span className="mr-auto font-sans text-data text-secondary">
          {changes > 0 ? t('permissions.changes', { count: changes }) : t('permissions.hint')}
        </span>
        <Button disabled={changes === 0 || saving} onClick={() => setDraft(permissions)}>
          {t('platformSettings.cancel')}
        </Button>
        <Button
          variant="primary"
          disabled={changes === 0}
          busy={saving}
          onClick={() => void saveAll()}
        >
          {t('permissions.save')}
        </Button>
      </footer>
    </div>
  )
}
