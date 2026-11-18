import type { LucideIcon } from 'lucide-react'

export interface MenuItem {
  id: string
  label: string
  /** 'label' renders a section heading, 'separator' a divider line. */
  kind?: 'item' | 'label' | 'separator'
  icon?: LucideIcon
  /**
   * Set, true or false, on an entry that can be ticked: screen readers hear a checkbox and whether
   * it is ticked, or with `radio` one choice of a group (B44). Left out on a plain entry.
   */
  checked?: boolean
  radio?: boolean
  disabled?: boolean
  /** Keys that do the same from anywhere, as aria-keyshortcuts takes them: "Control+Z". */
  shortcut?: string
  onSelect?: () => void
}
