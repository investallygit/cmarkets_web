import { useTranslation } from 'react-i18next'
import { Navigate, useParams } from 'react-router'
import { useSecurityProfile } from '@/entities/security'
import { ModuleLocked, useCurrentUser } from '@/entities/session'
import type { SecurityProfileDto } from '@/shared/api/contracts'
import { useSymbolSubscription } from '@/shared/realtime'
import { isSecurityFunction, securityPath, type SecurityFunction } from '@/shared/routes/paths'
import { hasProfileTab } from '@/shared/routes/profiles'
import { PanelEmpty, PanelError, PanelLoading } from '@/shared/ui/StatusViews'
import { BondProfileHeader } from '@/widgets/bond-profile-panels'
import { SecurityHeader } from '@/widgets/security-header'
import { TAB_CODES } from '../config/tabs'
import { BondTab, type BondFunction } from './BondTab'
import { EquityTab, type EquityFunction } from './EquityTab'
import { EtfTab, type EtfFunction } from './EtfTab'
import { SecurityTabs } from './SecurityTabs'
import { SharedTab, type SharedFunction } from './SharedTab'

/** Tabs of the Analysis module, as EQS and BP (spec section 6). */
const ANALYSIS_TABS: ReadonlySet<SecurityFunction> = new Set(['fa', 'bp'])

const isShared = (fn: SecurityFunction): fn is SharedFunction =>
  fn === 'n' || fn === 'doc' || fn === 'ana'

/**
 * The security profile, DES and the other tabs of spec section 9: GET /securities/{id} answers
 * the security's type, which opens the profile of that type (SECURITY_PROFILES): screen 2 for an
 * equity, screen 20 for a bond, screen 19 for an ETF (ETFS's blocks until step 33). Its header, its
 * tabs, then the panels of the tab.
 * /securities/{id}/{tab}; ?doc= and ?article= open a document or an article.
 */
export function SecurityProfilePage() {
  const { securityId = '', fn } = useParams()
  const profile = useSecurityProfile(securityId)
  // Real-time quotes of this security while the profile is open.
  useSymbolSubscription([securityId])

  if (!isSecurityFunction(fn)) return <Navigate to={securityPath(securityId)} replace />
  if (profile.isPending) return <PanelLoading />
  if (profile.isError) {
    return <PanelError error={profile.error} onRetry={() => void profile.refetch()} />
  }

  const security = profile.data
  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-col gap-2 px-2 pt-2">
        {security.type === 'bond' ? (
          <BondProfileHeader profile={security} />
        ) : (
          <SecurityHeader profile={security} />
        )}
        <SecurityTabs security={security} />
      </div>
      <div className="min-h-0 flex-1">
        <ProfileTab key={fn} fn={fn} security={security} />
      </div>
    </div>
  )
}

function ProfileTab({ fn, security }: { fn: SecurityFunction; security: SecurityProfileDto }) {
  const { t } = useTranslation()
  const user = useCurrentUser()

  if (!hasProfileTab(security.type, fn)) {
    return (
      <PanelEmpty
        message={t('security.notApplicable', { code: TAB_CODES[fn], security: security.code })}
      />
    )
  }
  if (ANALYSIS_TABS.has(fn) && !user.modules.includes('analysis')) {
    return <ModuleLocked module="analysis" />
  }
  if (isShared(fn)) return <SharedTab fn={fn} security={security} />
  if (security.type === 'bond') return <BondTab fn={fn as BondFunction} security={security} />
  if (security.type === 'etf') return <EtfTab fn={fn as EtfFunction} security={security} />
  return <EquityTab fn={fn as EquityFunction} security={security} />
}
