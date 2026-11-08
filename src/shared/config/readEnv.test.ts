import { describe, expect, it } from 'vitest'
import { readEnv, resolveApiPath, toApiPath } from './readEnv'

describe('readEnv', () => {
  it('serves everything from the site itself without VITE_API_URL', () => {
    expect(readEnv({})).toEqual({
      apiOrigin: '',
      apiBaseUrl: '/api/v1',
      realtimeHubUrl: '/hubs/market',
      chatHubUrl: '/hubs/chat',
      useMocks: false,
      devTools: false,
    })
  })

  it('puts the REST API and both hubs under VITE_API_URL', () => {
    const env = readEnv({ VITE_API_URL: 'https://api.cmarket.example/', VITE_USE_MOCKS: 'true' })
    expect(env).toEqual({
      apiOrigin: 'https://api.cmarket.example',
      apiBaseUrl: 'https://api.cmarket.example/api/v1',
      realtimeHubUrl: 'https://api.cmarket.example/hubs/market',
      chatHubUrl: 'https://api.cmarket.example/hubs/chat',
      useMocks: true,
      devTools: true,
    })
  })

  it("shows the prototype's helpers with the mock, or when VITE_DEV_TOOLS says so", () => {
    expect(readEnv({ VITE_USE_MOCKS: 'false', VITE_DEV_TOOLS: 'true' }).devTools).toBe(true)
    expect(readEnv({ VITE_USE_MOCKS: 'true', VITE_DEV_TOOLS: 'false' }).devTools).toBe(false)
    expect(readEnv({ VITE_USE_MOCKS: 'true', VITE_DEV_TOOLS: '' }).devTools).toBe(true)
  })

  it('lets each address be replaced on its own', () => {
    const env = readEnv({
      VITE_API_URL: 'http://localhost:5001',
      VITE_CHAT_HUB_URL: 'https://chat.cmarket.example/hubs/chat',
      VITE_API_BASE_URL: ' ',
    })
    expect(env.apiBaseUrl).toBe('http://localhost:5001/api/v1')
    expect(env.chatHubUrl).toBe('https://chat.cmarket.example/hubs/chat')
  })

  it.each([
    'api.cmarket.example',
    'ftp://api.cmarket.example',
    'https://api.cmarket.example/api/v1',
  ])('refuses %s as VITE_API_URL', (value) => {
    expect(() => readEnv({ VITE_API_URL: value })).toThrow(/VITE_API_URL/)
  })
})

describe('resolveApiPath', () => {
  const origin = 'https://api.cmarket.example'

  it("puts the API's own paths on its origin", () => {
    expect(resolveApiPath('/api/v1/profile-photos/42', origin)).toBe(
      'https://api.cmarket.example/api/v1/profile-photos/42',
    )
  })

  it('leaves the other addresses, and every address on the same origin', () => {
    expect(resolveApiPath('data:image/png;base64,AAAA', origin)).toBe('data:image/png;base64,AAAA')
    expect(resolveApiPath('/photos/home.jpg', origin)).toBe('/photos/home.jpg')
    expect(resolveApiPath('/api/v1/research-images/7', '')).toBe('/api/v1/research-images/7')
  })

  it('gives the path back from a resolved address', () => {
    const resolved = resolveApiPath('/api/v1/research-images/7', origin)
    expect(toApiPath(resolved, origin)).toBe('/api/v1/research-images/7')
    expect(toApiPath('https://elsewhere.example/api/v1/x', origin)).toBe(
      'https://elsewhere.example/api/v1/x',
    )
  })
})
