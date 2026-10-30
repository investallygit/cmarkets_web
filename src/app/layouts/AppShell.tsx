import { LoaderCircle, RefreshCw, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router'
import { useMarketRealtimeSync } from '@/entities/market'
import { useNewsRealtimeSync } from '@/entities/news'
import { useNotificationRealtimeSync } from '@/entities/notification'
import { useQuoteRealtimeSync } from '@/entities/quote'
import { useSecurityRealtimeSync } from '@/entities/security'
import { useMe } from '@/entities/session'
import { TableExportContext } from '@/shared/ui/tableExport'
import { Toaster } from '@/shared/ui/Toaster'
import { SideMenu } from '@/widgets/side-menu'
import { StatusBar } from '@/widgets/status-bar'
import { TickerTape } from '@/widgets/ticker-tape'
import { TopBar } from '@/widgets/top-bar'

/**
 * Layout shared by all screens (spec section 8): top bar 40 px, ticker tape 24 px,
 * left menu, workspace, status bar 22 px.
 */
export function AppShell() {
  const { t } = useTranslation()
  const me = useMe()
  useQuoteRealtimeSync()
  useMarketRealtimeSync()
  useNewsRealtimeSync()
  useNotificationRealtimeSync()
  useSecurityRealtimeSync()

  if (me.isPending) {
    return (
      <FullScreen>
        <LoaderCircle aria-hidden className="size-4 animate-spin" />
        {t('app.connecting')}
      </FullScreen>
    )
  }
  if (me.isError) {
    return (
      <FullScreen>
        <TriangleAlert aria-hidden className="size-4 text-down" />
        {t('app.sessionError')}
        <button
          type="button"
          onClick={() => void me.refetch()}
          className="inline-flex items-center gap-1 border px-2 py-0.5 hover:text-primary"
        >
          <RefreshCw aria-hidden className="size-3" />
          {t('app.retry')}
        </button>
      </FullScreen>
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
      <Toaster />
    </TableExportContext.Provider>
  )
}

function FullScreen({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center gap-2 font-sans text-label text-secondary">
      {children}
    </div>
  )
}
