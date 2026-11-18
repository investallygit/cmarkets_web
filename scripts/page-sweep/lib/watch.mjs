// What the sweep hears from a page while it is open: D1 page errors, D2 the console, D3 the API's
// answers, D10 the hubs' frames (the subscriptions and conversations a page holds).

const API = '/api/v1/'

/** Messages that are no fault of the page: the dev server's own and React's advertisement. */
const NOISE = [/Download the React DevTools/, /^\[vite\]/]

/** A SignalR frame, JSON protocol: records split by the record separator. */
function messages(payload) {
  if (typeof payload !== 'string') return []
  return payload
    .split('\u001e')
    .filter(Boolean)
    .flatMap((part) => {
      try {
        return [JSON.parse(part)]
      } catch {
        return []
      }
    })
}

/** The API's address without its prefix: "/news?pageSize=50". */
export function apiPath(url) {
  const parsed = new URL(url)
  return parsed.pathname.replace('/api/v1', '') + parsed.search
}

export function watch(page) {
  const visit = { console: [], errors: [], responses: [], failed: [], received: {}, dialogs: [] }
  const started = new Map()
  const subscriptions = new Map()
  const conversations = new Set()
  const opened = {}

  page.on('console', (message) => {
    const type = message.type()
    if (type !== 'error' && type !== 'warning') return
    const text = message.text()
    if (NOISE.some((pattern) => pattern.test(text))) return
    visit.console.push({ type, text: text.slice(0, 700) })
  })
  page.on('pageerror', (error) => visit.errors.push(String(error?.stack ?? error).slice(0, 1200)))
  page.on('dialog', (dialog) => {
    visit.dialogs.push(`${dialog.type()}: ${dialog.message()}`)
    dialog.dismiss().catch(() => {})
  })
  page.on('request', (request) => {
    if (request.url().includes(API)) started.set(request, Date.now())
  })
  page.on('requestfinished', (request) => started.delete(request))
  page.on('requestfailed', (request) => {
    if (!started.has(request)) return
    started.delete(request)
    visit.failed.push({
      method: request.method(),
      url: apiPath(request.url()),
      error: request.failure()?.errorText ?? 'failed',
    })
  })
  page.on('response', (response) => {
    const request = response.request()
    if (!request.url().includes(API)) return
    const since = started.get(request)
    visit.responses.push({
      method: request.method(),
      url: apiPath(request.url()),
      status: response.status(),
      ms: since ? Date.now() - since : null,
      at: Date.now(),
    })
  })
  page.on('websocket', (socket) => {
    const hub = new URL(socket.url()).pathname
    opened[hub] = (opened[hub] ?? 0) + 1
    socket.on('framesent', ({ payload }) => {
      for (const message of messages(payload)) {
        if (message.type !== 1) continue
        const [argument] = message.arguments ?? []
        if (message.target === 'Subscribe') {
          for (const symbol of argument ?? []) {
            subscriptions.set(symbol, (subscriptions.get(symbol) ?? 0) + 1)
          }
        } else if (message.target === 'Unsubscribe') {
          for (const symbol of argument ?? []) {
            const left = (subscriptions.get(symbol) ?? 0) - 1
            if (left > 0) subscriptions.set(symbol, left)
            else subscriptions.delete(symbol)
          }
        } else if (message.target === 'JoinConversation') conversations.add(argument)
        else if (message.target === 'LeaveConversation') conversations.delete(argument)
      }
    })
    socket.on('framereceived', ({ payload }) => {
      for (const message of messages(payload)) {
        if (message.type === 1)
          visit.received[message.target] = (visit.received[message.target] ?? 0) + 1
      }
    })
    socket.on('close', () => {
      if (hub.endsWith('/market')) subscriptions.clear()
      if (hub.endsWith('/chat')) conversations.clear()
    })
  })

  return {
    /** The API requests still waiting for an answer (the session's renewal left out). */
    inflight: () =>
      [...started.keys()].filter((request) => !request.url().includes('/auth/refresh')).length,
    /** A new page: what was heard on the one before is dropped. */
    reset() {
      visit.console = []
      visit.errors = []
      visit.responses = []
      visit.failed = []
      visit.received = {}
      visit.dialogs = []
    },
    heard: () => structuredClone(visit),
    subscriptions: () => [...subscriptions.keys()].sort(),
    conversations: () => [...conversations].sort(),
    opened: () => ({ ...opened }),
  }
}
