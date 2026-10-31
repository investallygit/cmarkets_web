import { http, HttpResponse } from 'msw'
import type { NewsArticleDto, NewsItemDto, Paged } from '@/shared/api/contracts'
import { allNews, findArticle } from '../content'
import { api, latency, paginate, problem } from '../lib/http'

export const newsHandlers = [
  http.get(api('/news'), async ({ request }) => {
    await latency()
    const query = new URL(request.url).searchParams
    const topic = query.get('topic')
    const securityId = query.get('securityId')
    const country = query.get('country')
    const items = allNews().filter(
      (item) =>
        (!topic || item.topic === topic) &&
        (!securityId || item.securityIds.includes(securityId)) &&
        (!country || item.country === country),
    )
    return HttpResponse.json<Paged<NewsItemDto>>(paginate(items, query))
  }),

  http.get(api('/news/:id'), async ({ params }) => {
    await latency()
    const article = findArticle(String(params.id))
    if (!article) return problem(404, 'News not found', `No news ${String(params.id)}.`)
    return HttpResponse.json<NewsArticleDto>(article)
  }),
]
