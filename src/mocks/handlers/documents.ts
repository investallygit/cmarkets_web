import { http, HttpResponse } from 'msw'
import type { DocumentDto, Paged } from '@/shared/api/contracts'
import { formatDate } from '@/shared/lib/format'
import { DOCUMENTS } from '../fixtures/documents'
import { api, latency, paginate, problem } from '../lib/http'
import { createPdf } from '../lib/pdf'
import { normalize } from '../lib/text'

export const documentHandlers = [
  // q stands in for the full-text search of the server: every word must be in the title or source.
  http.get(api('/documents'), async ({ request }) => {
    await latency()
    const query = new URL(request.url).searchParams
    const securityId = query.get('securityId')
    const type = query.get('type')
    const words = normalize(query.get('q') ?? '')
      .split(' ')
      .filter(Boolean)
    const items = DOCUMENTS.filter(
      (document) =>
        (!securityId || document.securityIds.includes(securityId)) &&
        (!type || document.type === type) &&
        words.every((word) => normalize(`${document.title} ${document.source}`).includes(word)),
    ).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    return HttpResponse.json<Paged<DocumentDto>>(paginate(items, query))
  }),

  http.get(api('/documents/:id/file'), async ({ params }) => {
    await latency()
    const document = DOCUMENTS.find((candidate) => candidate.id === params.id)
    if (!document) return problem(404, 'Document not found', `No document ${String(params.id)}.`)
    const pdf = createPdf(document.title, [
      `${document.source} · ${formatDate(document.publishedAt)} · ${document.pages} pages`,
      '',
      'Sample document of the CMarket prototype.',
      "In production, the Data admin uploads the issuer's file in the back-office (screen 6)",
      'and CMarket links it to the security profile.',
    ])
    return new HttpResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${document.id}.pdf"`,
      },
    })
  }),
]
