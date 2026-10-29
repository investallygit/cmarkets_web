import { http, HttpResponse } from 'msw'
import type { SearchResultsDto, SecuritySearchItemDto } from '@/shared/api/contracts'
import { securities, type MockSecurity } from '../db'
import { api, latency } from '../lib/http'

/** "Société", "6.25%" -> "SOCIETE", "6.25": accents and percent signs do not matter when typing. */
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/%/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function searchableWords(security: MockSecurity): string[] {
  const text = normalize(
    [security.code, security.id, security.name, ...(security.aliases ?? [])].join(' '),
  )
  return [...new Set([...text.split(' '), ...text.split(/[\s-]+/)])]
}

function toSearchItem(security: MockSecurity): SecuritySearchItemDto {
  const { id, code, name, type, exchange, country, currency } = security
  return { id, code, name, type, exchange, country, currency }
}

export const securityHandlers = [
  // Each typed word must start a word of the code, name or aliases: "ECMR 6.25 2029", "SCG".
  http.get(api('/search'), async ({ request }) => {
    await latency()
    const words = normalize(new URL(request.url).searchParams.get('q') ?? '')
      .split(' ')
      .filter(Boolean)
    const first = words.at(0) ?? ''
    const matches = [...securities.values()]
      .filter((security) => {
        const candidates = searchableWords(security)
        return (
          words.length > 0 &&
          words.every((word) => candidates.some((candidate) => candidate.startsWith(word)))
        )
      })
      .sort((a, b) => {
        const rank = (security: MockSecurity) =>
          normalize(security.code).startsWith(first) ? 0 : 1
        return rank(a) - rank(b) || a.code.localeCompare(b.code)
      })
    return HttpResponse.json<SearchResultsDto>({
      securities: matches.slice(0, 8).map(toSearchItem),
    })
  }),
]
