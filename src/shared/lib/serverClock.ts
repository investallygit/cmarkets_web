/**
 * The server's clock as /hubs/rfq gave it when its connection opened (ServerTime): the RFQ's
 * countdowns read it (ROADMAP step 44), so that a client's clock set wrong shows the same time
 * left as the server, which closes the requests. Set by entities/svt-link's hub sync, read by
 * entities/rfq's countdowns.
 */
let offsetMs = 0

export function setServerTime(at: string) {
  const server = Date.parse(at)
  if (!Number.isNaN(server)) offsetMs = server - Date.now()
}

/** Milliseconds since the epoch on the server's clock. */
export function serverNow(): number {
  return Date.now() + offsetMs
}
