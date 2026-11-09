import { describe, expect, it } from 'vitest'
import type { ConversationState, ConversationSummaryDto } from '@/shared/api/contracts'
import { openConversations } from './conversations'

const conversation = (id: string, title: string, state: ConversationState = 'open') =>
  ({ id, title, state }) as ConversationSummaryDto

describe('openConversations', () => {
  const all = [
    conversation('owona', 'P. Owona'),
    conversation('desk', 'CEMAC rates desk'),
    conversation('mvondo', 'S. Mvondo', 'requestReceived'),
    conversation('ndong', 'Économie du Gabon'),
    conversation('blocked', 'T. Bekale', 'closed'),
    conversation('waiting', 'R. Tamba', 'requestSent'),
  ]

  it('offers the open conversations only', () => {
    expect(openConversations(all, '').map((item) => item.id)).toEqual(['owona', 'desk', 'ndong'])
  })

  it('finds a name whatever its accents and case', () => {
    expect(openConversations(all, ' econ').map((item) => item.id)).toEqual(['ndong'])
    expect(openConversations(all, 'OWONA').map((item) => item.id)).toEqual(['owona'])
    expect(openConversations(all, 'bekale')).toEqual([])
  })
})
