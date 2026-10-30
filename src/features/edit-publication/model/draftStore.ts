import { create } from 'zustand'
import type { PublicationAccess, PublicationDto, PublicationStatus } from '@/shared/api/contracts'
import { toDraftForm, type DraftForm, type PricingForm } from './draftForm'

/** conflict: saved elsewhere meanwhile (409); invalid: refused (400); failed: not reached. */
export type DraftFailure = 'conflict' | 'invalid' | 'failed'

/**
 * The publication open in the studio, shared by the editor and the settings: the working copy as
 * edited, and what the server holds of it.
 */
export interface Draft {
  publicationId: string
  /** Changes each time the server copy replaces the draft: the editor starts again from it. */
  generation: number
  status: PublicationStatus
  /** Published at least once: changes become a new version. */
  published: boolean
  readFree: boolean
  /** The access saved on the server, which the free-to-paid rule looks at. */
  savedAccess: PublicationAccess
  /** Saved changes not yet published as a new version. */
  hasChanges: boolean
  referenceDate: string | null
  referencePrice: number | null
  form: DraftForm
  pricing: PricingForm
  version: number
  savedAt: string
  /** Edits counted as they come, and the counts the server has: equal when saved. */
  contentEdits: number
  pricingEdits: number
  savedContentEdits: number
  savedPricingEdits: number
  saving: boolean
  /** Submission tried: every check shows, not only the limits. */
  checked: boolean
  failure: DraftFailure | null
  /** The edits the server refused: not sent again until changed. */
  failedEdits: number | null
  serverErrors: Record<string, string[]>
}

let generations = 0

function fromServer(publication: PublicationDto): Draft {
  return {
    publicationId: publication.id,
    generation: ++generations,
    status: publication.status,
    published: publication.versions.length > 0,
    readFree: publication.readFree,
    savedAccess: publication.pricing.access,
    hasChanges: publication.hasChanges,
    referenceDate: publication.referenceDate,
    referencePrice: publication.referencePrice,
    form: toDraftForm(publication),
    pricing: { ...publication.pricing },
    version: publication.version,
    savedAt: publication.savedAt,
    contentEdits: 0,
    pricingEdits: 0,
    savedContentEdits: 0,
    savedPricingEdits: 0,
    saving: false,
    checked: false,
    failure: null,
    failedEdits: null,
    serverErrors: {},
  }
}

export const isDirty = (draft: Draft) =>
  draft.contentEdits !== draft.savedContentEdits || draft.pricingEdits !== draft.savedPricingEdits

/** A draft and a published publication change; one in moderation or archived does not. */
export const isEditable = (draft: Pick<Draft, 'status'>) =>
  draft.status === 'draft' || draft.status === 'published'

interface DraftState {
  draft: Draft | null
  /** The server copy becomes the draft: another publication, a reload, a lifecycle step. */
  open: (publication: PublicationDto) => void
  edit: (patch: Partial<DraftForm>) => void
  editPricing: (patch: Partial<PricingForm>) => void
  setSaving: (publicationId: string, saving: boolean) => void
  saved: (
    publicationId: string,
    publication: PublicationDto,
    edits: { content?: number; pricing?: number },
  ) => void
  failed: (publicationId: string, failure: DraftFailure, errors?: Record<string, string[]>) => void
  /** The automatic checks of a submission refused it (422): their errors by field. */
  rejected: (publicationId: string, errors: Record<string, string[]>) => void
  /** Submit pressed: the editor and the settings show every check. */
  check: (publicationId: string) => void
}

/** The server's errors left once the fields they were about change. */
function withoutErrors(errors: Record<string, string[]>, fields: readonly string[]) {
  const subject = fields.includes('subjectId') || fields.includes('subjectType')
  return Object.fromEntries(
    Object.entries(errors).filter(
      ([field]) => !fields.includes(field) && !(subject && field === 'subject'),
    ),
  )
}

export const useDraftStore = create<DraftState>()((set) => {
  /** Applies to this publication's draft only: the user may have opened another one since. */
  const update = (publicationId: string, change: (draft: Draft) => Partial<Draft>) =>
    set(({ draft }) =>
      draft?.publicationId === publicationId ? { draft: { ...draft, ...change(draft) } } : {},
    )
  return {
    draft: null,
    open: (publication) => set({ draft: fromServer(publication) }),
    edit: (patch) =>
      set(({ draft }) =>
        draft
          ? {
              draft: {
                ...draft,
                form: { ...draft.form, ...patch },
                contentEdits: draft.contentEdits + 1,
                serverErrors: withoutErrors(draft.serverErrors, Object.keys(patch)),
              },
            }
          : {},
      ),
    editPricing: (patch) =>
      set(({ draft }) =>
        draft
          ? {
              draft: {
                ...draft,
                pricing: { ...draft.pricing, ...patch },
                pricingEdits: draft.pricingEdits + 1,
                serverErrors: withoutErrors(draft.serverErrors, Object.keys(patch)),
              },
            }
          : {},
      ),
    setSaving: (publicationId, saving) => update(publicationId, () => ({ saving })),
    saved: (publicationId, publication, edits) =>
      update(publicationId, (draft) => ({
        saving: false,
        failure: null,
        failedEdits: null,
        serverErrors: {},
        status: publication.status,
        readFree: publication.readFree,
        savedAccess: publication.pricing.access,
        hasChanges: publication.hasChanges,
        referenceDate: publication.referenceDate,
        referencePrice: publication.referencePrice,
        version: publication.version,
        savedAt: publication.savedAt,
        savedContentEdits: edits.content ?? draft.savedContentEdits,
        savedPricingEdits: edits.pricing ?? draft.savedPricingEdits,
      })),
    failed: (publicationId, failure, errors = {}) =>
      update(publicationId, (draft) => ({
        saving: false,
        failure,
        serverErrors: errors,
        failedEdits: draft.contentEdits + draft.pricingEdits,
      })),
    rejected: (publicationId, errors) => update(publicationId, () => ({ serverErrors: errors })),
    check: (publicationId) => update(publicationId, () => ({ checked: true })),
  }
})
