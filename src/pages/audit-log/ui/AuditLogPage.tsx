import { useState } from 'react'
import { ScreenWorkspace } from '@/features/workspace-layout'
import type { AuditEntryDto } from '@/shared/api/contracts'
import type { WorkspaceItem } from '@/shared/ui/Workspace'
import { AuditEntryPanel, AuditLogPanel } from '@/widgets/audit-log-panel'

/** AUDT has no mockup: the log, and the entry clicked with its values before and after. */
const LAYOUT: readonly WorkspaceItem[] = [
  { i: 'log', x: 0, y: 0, w: 8, h: 26, minW: 6, minH: 8 },
  { i: 'entry', x: 8, y: 0, w: 4, h: 26, minW: 3, minH: 6 },
]

/**
 * AUDT: who did what and when, with the values before and after, filtered by user, action and
 * dates (/admin/audit?userId=user-mba); USER's "View audit log" opens it on an account.
 */
export function AuditLogPage() {
  const [entry, setEntry] = useState<AuditEntryDto | null>(null)
  const panels = {
    log: <AuditLogPanel selectedId={entry?.id ?? null} onSelect={setEntry} />,
    entry: <AuditEntryPanel entry={entry} />,
  }
  return <ScreenWorkspace screenId="AUDT" defaultLayout={LAYOUT} panels={panels} />
}
