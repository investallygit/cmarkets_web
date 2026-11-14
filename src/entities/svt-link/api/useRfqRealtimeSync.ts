import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useRfqConnection, useRfqEvent } from '@/shared/realtime'
import { toast } from '@/shared/ui/toast'
import { setServerTime } from '../model/serverClock'
import { svtLinkKeys } from './queries'

/**
 * The /hubs/rfq hub (spec section 10), connected while the user holds one of the RFQ's keys: a
 * trader's links are read again when one changes, a bank's requests and linked traders when a
 * trader asks or a colleague decides; the server's clock is kept for the countdowns. Mounted once
 * by the app shell.
 */
export function useRfqRealtimeSync(enabled: boolean) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  useRfqConnection(enabled)

  const refresh = (queryKey: readonly unknown[]) => void queryClient.invalidateQueries({ queryKey })

  useRfqEvent('SvtLinkChanged', () => refresh(svtLinkKeys.mine()))
  useRfqEvent('LinkRequested', () => {
    refresh(svtLinkKeys.bank())
    toast.info(t('rfq.realtime.linkRequested'))
  })
  useRfqEvent('LinkChanged', () => refresh(svtLinkKeys.bank()))
  useRfqEvent('ServerTime', ({ at }) => setServerTime(at))
}
