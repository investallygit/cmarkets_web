import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TYPING_SHOWN_MS } from '../config/messaging'
import { resetChatState, setPresence, startTyping, stopTyping, useChatState } from './chatState'

// "typing…" and presence, as the /hubs/chat hub tells them (step 17).
const typing = (conversationId: string) => useChatState.getState().typing[conversationId]

describe('chat state', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    resetChatState()
    vi.useRealTimers()
  })

  it('shows someone typing until a few seconds after the last indicator', () => {
    startTyping('c1', 'user-k')
    vi.advanceTimersByTime(TYPING_SHOWN_MS - 1_000)
    // Typing again: the indicator lasts.
    startTyping('c1', 'user-k')
    vi.advanceTimersByTime(TYPING_SHOWN_MS - 1_000)
    expect(typing('c1')).toEqual(['user-k'])
    vi.advanceTimersByTime(1_000)
    expect(typing('c1')).toBeUndefined()
  })

  it('stops the indicator of the author of a message, and keeps the others', () => {
    startTyping('c1', 'user-k')
    startTyping('c1', 'user-t')
    startTyping('c2', 'user-k')
    stopTyping('c1', 'user-k')
    expect(typing('c1')).toEqual(['user-t'])
    expect(typing('c2')).toEqual(['user-k'])
  })

  it('keeps the presence pushed, until a new connection reads it again', () => {
    setPresence('user-k', true)
    const before = useChatState.getState()
    setPresence('user-k', true)
    expect(useChatState.getState()).toBe(before)
    startTyping('c1', 'user-k')
    resetChatState()
    expect(useChatState.getState()).toMatchObject({ typing: {}, online: {} })
  })
})
