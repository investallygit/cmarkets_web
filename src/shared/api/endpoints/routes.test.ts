import { describe, expect, it } from 'vitest'
import { ROUTE_TABLES } from '.'
import openApiRoutes from './openapi-routes.txt?raw'

/** 'PUT /watchlists/{}': a route with its parameters unnamed, as both sides may name them apart. */
const key = (method: string, path: string) => `${method} ${path.replace(/\{[^}]+\}/g, '{}')}`

const declared = Object.entries(ROUTE_TABLES).flatMap(([area, table]) =>
  Object.entries(table).map(([name, endpoint]) => ({ name: `${area}.${name}`, ...endpoint })),
)

const served = new Set(
  openApiRoutes
    .split('\n')
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const [method, path] = line.split(' ')
      return key(method, path)
    }),
)

describe('the routes of the API module', () => {
  it("are all among the routes of CMarket.Api's OpenAPI document", () => {
    const missing = declared
      .filter((endpoint) => !endpoint.devOnly && !served.has(key(endpoint.method, endpoint.path)))
      .map((endpoint) => `${endpoint.name}: ${endpoint.method} ${endpoint.path}`)
    expect(missing).toEqual([])
  })

  it('are each declared once', () => {
    const seen = new Map<string, string>()
    const twice = declared.flatMap((endpoint) => {
      const route = key(endpoint.method, endpoint.path)
      const first = seen.get(route)
      seen.set(route, endpoint.name)
      return first ? [`${route}: ${first} and ${endpoint.name}`] : []
    })
    expect(twice).toEqual([])
  })
})
