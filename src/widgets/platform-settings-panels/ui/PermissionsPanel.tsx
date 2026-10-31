import { useTranslation } from 'react-i18next'
import { useRolePermissions } from '@/entities/platform-settings'
import { PermissionMatrix } from '@/features/edit-permissions'
import { Panel } from '@/shared/ui/Panel'
import { PanelError, PanelLoading } from '@/shared/ui/StatusViews'

/** ADMCFG, permissions: what each account type may do (spec section 12). */
export function PermissionsPanel() {
  const { t } = useTranslation()
  const roles = useRolePermissions()
  return (
    <Panel title={t('panels.permissions')} code="CFG">
      {roles.data ? (
        // Saved changes come back as new data: the matrix starts again from them.
        <PermissionMatrix key={JSON.stringify(roles.data)} permissions={roles.data} />
      ) : roles.error ? (
        <PanelError error={roles.error} onRetry={() => void roles.refetch()} />
      ) : (
        <PanelLoading />
      )}
    </Panel>
  )
}
