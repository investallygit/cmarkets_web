import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router'
import { useAlertRealtimeSync } from '@/entities/alert'
import { useAuctionRealtimeSync } from '@/entities/auction'
import { useChatRealtimeSync } from '@/entities/conversation'
import { useDataImportRealtimeSync } from '@/entities/data-import'
import { useMarketRealtimeSync } from '@/entities/market'
import { useNewsRealtimeSync } from '@/entities/news'
import { usePublicationRealtimeSync } from '@/entities/publication'
import { useNotificationRealtimeSync } from '@/entities/notification'
import { useQuoteRealtimeSync } from '@/entities/quote'
import { useSecurityRealtimeSync } from '@/entities/security'
import { mayWriteMessages, useMe, useProfilePreferences } from '@/entities/session'
import { useYieldCurveRealtimeSync } from '@/entities/yield-curve'
import { InactivityLogout } from '@/features/log-out'
import { AlertDialogHost } from '@/features/manage-alerts'
import { WatchlistDialogHost } from '@/features/manage-watchlists'
import { useNoBrowserTranslation } from '@/shared/lib/useNoBrowserTranslation'
import { TableExportContext } from '@/shared/ui/tableExport'
import { Toaster } from '@/shared/ui/Toaster'
import { SideMenu } from '@/widgets/side-menu'
import { StatusBar } from '@/widgets/status-bar'
import { TickerTape } from '@/widgets/ticker-tape'
import { TopBar } from '@/widgets/top-bar'
import { FullScreenStatus } from './FullScreenStatus'

/**
 * Layout shared by all screens (spec section 8): top bar 40 px, ticker tape 24 px,
 * left menu, workspace, status bar 22 px.
 */
export function AppShell() {
  const { t } = useTranslation()
  const me = useMe()
  useProfilePreferences(me.data)
  useQuoteRealtimeSync()
  useMarketRealtimeSync()
  useNewsRealtimeSync()
  usePublicationRealtimeSync()
  useNotificationRealtimeSync()
  useAlertRealtimeSync()
  useSecurityRealtimeSync()
  useAuctionRealtimeSync()
  useYieldCurveRealtimeSync()
  useDataImportRealtimeSync()
  // The second hub, of the messaging, for the users who write to others.
  useChatRealtimeSync(me.data ? mayWriteMessages(me.data) : false, me.data?.id)
  // The terminal speaks French and English itself (spec section 7), and its live figures must not
  // freeze under a translation of the browser.
  useNoBrowserTranslation()

  if (me.isPending) return <FullScreenStatus kind="loading" />
  if (me.isError) {
    return (
      <FullScreenStatus
        kind="error"
        message={t('app.sessionError')}
        onRetry={() => void me.refetch()}
      />
    )
  }

  return (
    // Spec section 12: Students cannot export tables.
    <TableExportContext.Provider value={me.data.permissions.includes('analysis:export')}>
      <div className="grid h-full grid-cols-[auto_minmax(0,1fr)] grid-rows-[40px_24px_minmax(0,1fr)_22px]">
        <TopBar className="col-span-2" />
        <div className="col-span-2 min-w-0 border-b bg-app">
          <TickerTape />
        </div>
        <SideMenu />
        <main className="min-h-0 min-w-0 overflow-hidden bg-app">
          <Outlet />
        </main>
        <StatusBar className="col-span-2" />
      </div>
      {/* Forms opened from the right-click menu of any security. */}
      <WatchlistDialogHost />
      <AlertDialogHost />
      <InactivityLogout />
      <Toaster />
    </TableExportContext.Provider>
  )
}
