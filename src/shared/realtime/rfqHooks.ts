import { useContext, useEffect, useRef } from 'react'
import type { RfqClient } from './client'
import { RfqContext } from './context'
import type { RfqEventName, RfqHandler } from './events'

/** The RFQ's hub, or null where none is given (a test of another screen). */
export function useRfqClient(): RfqClient | null {
  return useContext(RfqContext)
}

/** Connects the RFQ's hub while `enabled`: a user who holds one of its keys. */
export function useRfqConnection(enabled: boolean) {
  const client = useRfqClient()
  useEffect(() => {
    if (!enabled || !client) return
    void client.start()
    return () => void client.stop()
  }, [client, enabled])
}

/** Calls the latest `handler` for every `event` of the RFQ's hub while the component is mounted. */
export function useRfqEvent<E extends RfqEventName>(event: E, handler: RfqHandler<E>) {
  const client = useRfqClient()
  const handlerRef = useRef(handler)

  useEffect(() => {
    handlerRef.current = handler
  })

  useEffect(() => client?.on(event, (payload) => handlerRef.current(payload)), [client, event])
}
