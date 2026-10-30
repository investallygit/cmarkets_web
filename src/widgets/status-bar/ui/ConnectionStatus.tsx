import { clsx } from 'clsx'
import { Circle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useConnectionState, type ConnectionState } from '@/shared/realtime'

const STATE_TEXT: Record<ConnectionState, string> = {
  connected: 'text-up',
  connecting: 'text-warning',
  reconnecting: 'text-warning',
  disconnected: 'text-down',
}

/** Real-time connection status of the status bar. */
export function ConnectionStatus() {
  const { t } = useTranslation()
  const state = useConnectionState()
  return (
    <span
      className={clsx('inline-flex shrink-0 items-center gap-1.5 uppercase', STATE_TEXT[state])}
    >
      <Circle aria-hidden strokeWidth={0} className="size-2 fill-current" />
      {t(`shell.realtime.${state}`)}
    </span>
  )
}
