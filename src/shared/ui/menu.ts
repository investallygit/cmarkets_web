import type { LucideIcon } from 'lucide-react'

export interface MenuItem {
  id: string
  label: string
  /** 'label' renders a section heading, 'separator' a divider line. */
  kind?: 'item' | 'label' | 'separator'
  icon?: LucideIcon
  checked?: boolean
  disabled?: boolean
  /** Keys that do the same from anywhere, as aria-keyshortcuts takes them: "Control+Z". */
  shortcut?: string
  onSelect?: () => void
}
