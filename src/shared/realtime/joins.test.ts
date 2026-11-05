import { describe, expect, it, vi } from 'vitest'
import type { ChatClient, ConnectionState } from './client'
import { getJoinRegistry } from './joins'

function fakeClient() {
  const listeners = new Set<(state: ConnectionState) => void>()
  const client = {
    state: 'connected',
    start: vi.fn(),
    stop: vi.fn(),
    joinConversation: vi.fn(() => Promise.resolve()),
    leaveConversation: vi.fn(() => Promise.resolve()),
    typing: vi.fn(),
    on: vi.fn(),
    onStateChange: (listener: (state: ConnectionState) => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  } as unknown as ChatClient
  return { client, reconnect: () => listeners.forEach((listener) => listener('connected')) }
}

// JoinConversation and LeaveConversation of the /hubs/chat hub (step 17).
describe('joined conversations', () => {
  it('joins once while a thread shows, and leaves when the last one closes', () => {
    const { client } = fakeClient()
    const registry = getJoinRegistry(client)
    const first = registry.acquire('c1')
    const second = registry.acquire('c1')
    expect(client.joinConversation).toHaveBeenCalledTimes(1)
    expect(registry.has('c1')).toBe(true)
    first()
    first()
    expect(client.leaveConversation).not.toHaveBeenCalled()
    second()
    expect(client.leaveConversation).toHaveBeenCalledWith('c1')
    expect(registry.has('c1')).toBe(false)
  })

  it('joins again after a reconnection, which starts without groups', () => {
    const { client, reconnect } = fakeClient()
    const registry = getJoinRegistry(client)
    registry.acquire('c1')
    registry.acquire('c2')()
    reconnect()
    expect(vi.mocked(client.joinConversation).mock.calls).toEqual([['c1'], ['c2'], ['c1']])
  })
})
