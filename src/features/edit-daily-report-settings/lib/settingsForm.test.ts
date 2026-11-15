import { describe, expect, it } from 'vitest'
import { hasErrors, inputOf, settingsErrors, type SettingsForm } from './settingsForm'

const form = (changes: Partial<SettingsForm> = {}): SettingsForm => ({
  sendTime: '18:00',
  beacAddress: 'marche-secondaire@beac.example',
  copies: ['compliance@cmarket.example'],
  nilReport: true,
  ...changes,
})

describe('settingsForm', () => {
  it('takes the mockup settings as they are', () => {
    const errors = settingsErrors(form())
    expect(hasErrors(errors)).toBe(false)
  })

  it('wants a time HH:mm and e-mail addresses', () => {
    const errors = settingsErrors(form({ sendTime: '18h', beacAddress: 'beac', copies: ['risk'] }))
    expect([errors.sendTime, errors.beacAddress, errors.copies[0]]).toEqual([
      'time',
      'address',
      'address',
    ])
    expect(settingsErrors(form({ sendTime: '24:00' })).sendTime).toBe('time')
  })

  it('takes each address once, the BEAC in To, whatever the case', () => {
    const errors = settingsErrors(
      form({
        copies: [
          'Compliance@CMarket.example',
          'compliance@cmarket.example',
          'MARCHE-SECONDAIRE@beac.example',
        ],
      }),
    )
    expect(errors.copies).toEqual([undefined, 'duplicate', 'duplicate'])
  })

  it('takes ten copies at most, the blank ones aside', () => {
    const copies = Array.from({ length: 11 }, (_, index) => `copy${index}@cmarket.example`)
    expect(settingsErrors(form({ copies })).list).toBe('tooMany')
    expect(settingsErrors(form({ copies: [...copies.slice(0, 10), ' '] })).list).toBeUndefined()
  })

  it('sends the copies filled in, at the version read', () => {
    expect(inputOf(form({ copies: [' risk@cmarket.example ', ''] }), '3')).toEqual({
      sendTime: '18:00',
      beacAddress: 'marche-secondaire@beac.example',
      copies: ['risk@cmarket.example'],
      nilReport: true,
      version: '3',
    })
  })
})
