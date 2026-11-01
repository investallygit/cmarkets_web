import { http, HttpResponse } from 'msw'
import { moderationQueue, moderationView } from '../../admin'
import { contentReportStore, publicationStore, recordAudit } from '../../db'
import { api, latency, noContent, problem } from '../../lib/http'
import { latestVersion } from '../../lib/research'
import { publish } from '../../publications'
import { allowed, decision, forbidden, invalid, notFound, readReason } from './common'

/** MOD: publications waiting for approval or reported by readers, kept or taken down. */
export const moderationHandlers = [
  http.get(api('/admin/publications'), async ({ request }) => {
    await latency()
    if (!allowed('moderation:manage')) return forbidden()
    const status = new URL(request.url).searchParams.get('status')
    const kind = status === 'pending' ? 'pending' : status === 'reported' ? 'reported' : null
    return HttpResponse.json(
      moderationQueue().filter((item) => kind === null || item.kind === kind),
    )
  }),

  // Prototype: the moderator reads the publication, or the draft submitted, as readers will.
  http.get(api('/admin/publications/:id'), async ({ params }) => {
    await latency()
    if (!allowed('moderation:manage')) return forbidden()
    const publication = publicationStore.read().find((candidate) => candidate.id === params.id)
    const view = publication && moderationView(publication)
    return view ? HttpResponse.json(view) : notFound('Publication', params.id)
  }),

  // A publication waiting goes live; a reported one stays, its reports closed.
  http.post(api('/admin/publications/:id/approve'), async ({ params }) => {
    await latency()
    if (!allowed('moderation:manage')) return forbidden()
    const publications = publicationStore.read()
    const publication = publications.find((candidate) => candidate.id === params.id)
    if (!publication) return notFound('Publication', params.id)
    const target = {
      type: 'publication',
      id: publication.id,
      label: latestVersion(publication)?.content.title ?? publication.draft.title,
    } as const
    if (publication.status === 'pending') {
      publish(publication)
      publication.savedAt = new Date().toISOString()
      publicationStore.write(publications)
      recordAudit('publication-approve', target, {
        changes: [
          { field: 'publicationStatus', scope: null, before: 'pending', after: 'published' },
        ],
      })
      return noContent()
    }
    const reports = contentReportStore.read()
    const open = reports.filter(
      (report) => report.publicationId === publication.id && report.status === 'open',
    )
    if (open.length === 0) return problem(409, 'Nothing to moderate')
    const closed = decision()
    open.forEach((report) =>
      Object.assign(report, {
        status: 'closed',
        closedAt: closed.at,
        closedBy: closed.by,
        outcome: 'kept',
      }),
    )
    contentReportStore.write(reports)
    recordAudit('publication-keep', target)
    return noContent()
  }),

  http.post(api('/admin/publications/:id/takedown'), async ({ params, request }) => {
    await latency()
    if (!allowed('moderation:manage')) return forbidden()
    const publications = publicationStore.read()
    const publication = publications.find((candidate) => candidate.id === params.id)
    if (!publication) return notFound('Publication', params.id)
    const reason = await readReason(request)
    if (typeof reason !== 'string') return invalid('Invalid takedown', reason)
    if (publication.status !== 'published' && publication.status !== 'pending') {
      return problem(409, 'Not online', 'Only a publication online or waiting is taken down.')
    }
    const before = publication.status
    // Buyers keep the version they bought (spec section 13).
    publication.status = 'archived'
    publication.archiveReason = reason
    publication.savedAt = new Date().toISOString()
    publicationStore.write(publications)
    const reports = contentReportStore.read()
    const closed = decision()
    reports
      .filter((report) => report.publicationId === publication.id && report.status === 'open')
      .forEach((report) =>
        Object.assign(report, {
          status: 'closed',
          closedAt: closed.at,
          closedBy: closed.by,
          outcome: 'takenDown',
        }),
      )
    contentReportStore.write(reports)
    recordAudit(
      'publication-takedown',
      {
        type: 'publication',
        id: publication.id,
        label: latestVersion(publication)?.content.title ?? publication.draft.title,
      },
      {
        changes: [{ field: 'publicationStatus', scope: null, before, after: 'archived' }],
        reason,
      },
    )
    return noContent()
  }),
]
