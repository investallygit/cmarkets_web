import { LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLogout } from '@/entities/session'
import type { MenuItem } from '@/shared/ui/menu'

/** "Log out" at the end of the user menu: this tab and the others go back to the login page. */
export function useLogoutMenuItems(): MenuItem[] {
  const { t } = useTranslation()
  const { mutate: logout } = useLogout()
  return [
    { id: 'logout-separator', kind: 'separator', label: '' },
    { id: 'logout', label: t('session.logout'), icon: LogOut, onSelect: () => logout('logout') },
  ]
}
