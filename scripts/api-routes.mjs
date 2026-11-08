// npm run api:routes: writes the routes of CMarket.Api's OpenAPI document (served in development
// only) to src/shared/api/endpoints/openapi-routes.txt, which the module's routes are checked
// against. The API's address: API_URL, http://localhost:5001 by default.
import { writeFile } from 'node:fs/promises'

const apiUrl = (process.env.API_URL ?? 'http://localhost:5001').replace(/\/+$/, '')
const prefix = '/api/v1'
const target = new URL('../src/shared/api/endpoints/openapi-routes.txt', import.meta.url)

let document
try {
  const response = await fetch(`${apiUrl}/openapi/v1.json`)
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
  document = await response.json()
} catch (error) {
  console.error(`Cannot read ${apiUrl}/openapi/v1.json (${error.message}).`)
  console.error('Start CMarket.Api in development, or set API_URL.')
  process.exit(1)
}

const methods = ['get', 'post', 'put', 'patch', 'delete']
const lines = Object.entries(document.paths)
  .filter(([path]) => path.startsWith(`${prefix}/`))
  .flatMap(([path, operations]) =>
    methods
      .filter((method) => method in operations)
      .map((method) => `${method.toUpperCase()} ${path.slice(prefix.length)}`),
  )
  .sort((a, b) => a.split(' ')[1].localeCompare(b.split(' ')[1]) || a.localeCompare(b))

const header = [
  `# The routes of CMarket.Api's OpenAPI document (${document.info?.title ?? 'CMarket.Api'} ${document.info?.version ?? ''}).`,
  '# Written by npm run api:routes from a running API; do not edit by hand.',
]
await writeFile(target, `${[...header, ...lines].join('\n')}\n`)
console.log(`${lines.length} routes written to ${target.pathname}`)
