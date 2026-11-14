import { useState } from 'react'
import { useHasPermission } from '@/entities/session'
import { ScreenWorkspace, type ScreenPanel } from '@/features/workspace-layout'
import type { AuditEntryDto } from '@/shared/api/contracts'
import { AuditEntryPanel, AuditLogPanel, RfqAuditExportPanel } from '@/widgets/audit-log-panel'

/** AUDT has no mockup: the log, and the entry clicked with its values before and after. */
const LAYOUT: readonly ScreenPanel[] = [
  { i: 'log', name: 'auditLog', x: 0, y: 0, w: 8, h: 26, minW: 6, minH: 8 },
  { i: 'entry', name: 'auditEntry', x: 8, y: 0, w: 4, h: 26, minW: 3, minH: 6 },
]

/** The same, the RFQ's compliance export under the entry for the holder of rfq:report (ROADMAP step 44). */
const RFQ_LAYOUT: readonly ScreenPanel[] = [
  LAYOUT[0]!,
  { i: 'entry', name: 'auditEntry', x: 8, y: 0, w: 4, h: 15, minW: 3, minH: 6 },
  { i: 'rfqAudit', name: 'rfqAudit', x: 8, y: 15, w: 4, h: 11, minW: 3, minH: 6 },
]

/**
 * AUDT: who did what and when, with the values before and after, filtered by user, action and
 * dates (/admin/audit?userId=user-mba); USER's "View audit log" opens it on an account.
 */
export function AuditLogPage() {
  const [entry, setEntry] = useState<AuditEntryDto | null>(null)
  const compliance = useHasPermission('rfq:report')
  const panels = {
    log: <AuditLogPanel selectedId={entry?.id ?? null} onSelect={setEntry} />,
    entry: <AuditEntryPanel entry={entry} />,
    ...(compliance ? { rfqAudit: <RfqAuditExportPanel /> } : {}),
  }
  return (
    <ScreenWorkspace
      screenId="AUDT"
      defaultLayout={compliance ? RFQ_LAYOUT : LAYOUT}
      panels={panels}
    />
  )
}
