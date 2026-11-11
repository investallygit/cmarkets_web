import { create } from 'zustand'
import type { ProviderNewsDto } from '@/shared/api/contracts'
import { defaultSchedule, doualaParts, toNewsForm, type NewsForm } from './newsForm'

/** conflict: saved elsewhere meanwhile (409); invalid: refused (400); failed: not reached. */
export type NewsSaveFailure = 'conflict' | 'invalid' | 'failed'

/** How the item goes live: now, or at a day and time of Douala. */
export interface GoLive {
  mode: 'now' | 'scheduled'
  date: string
  time: string
}

/**
 * The item open in the studio, shared by the editor and the publishing panel: the working copy as
 * edited, the server's copy (its status, times, PDF), and the choices of the publication.
 */
export interface NewsDraft {
  newsId: string
  /** Changes each time the server copy replaces the working copy: the editor starts again from it. */
  generation: number
  /** The server's copy: status, times, attachment, as last read or saved. */
  item: ProviderNewsDto
  form: NewsForm
  /** The version the working copy started from, sent back with the next save. */
  version: number
  savedAt: string
  /** Edits counted as they come, and the count the server has: equal when saved. */
  edits: number
  savedEdits: number
  saving: boolean
  /** Publish tried: every missing field shows, not only the limits. */
  checked: boolean
  failure: NewsSaveFailure | null
  /** The edits the server refused: not sent again until changed. */
  failedEdits: number | null
  serverErrors: Record<string, string[]>
  /** "I certify I hold the rights…": ticked for the publication. */
  rightsConfirmed: boolean
  goLive: GoLive
}

let generations = 0

function fromServer(item: ProviderNewsDto): NewsDraft {
  const schedule = item.publishAt ? doualaParts(item.publishAt) : defaultSchedule(new Date())
  return {
    newsId: item.id,
    generation: ++generations,
    item,
    form: toNewsForm(item),
    version: item.version,
    savedAt: item.updatedAt,
    edits: 0,
    savedEdits: 0,
    saving: false,
    checked: false,
    failure: null,
    failedEdits: null,
    serverErrors: {},
    // A published or scheduled item stated its rights; a draft states them at its publication.
    rightsConfirmed: item.status !== 'draft' && item.rightsConfirmedAt !== null,
    goLive: { mode: item.status === 'scheduled' ? 'scheduled' : 'now', ...schedule },
  }
}

export const isNewsDirty = (draft: NewsDraft) => draft.edits !== draft.savedEdits

/** A withdrawn item no longer changes, nor one waiting for CMarket's review (ROADMAP step 27). */
export const isNewsEditable = (draft: Pick<NewsDraft, 'item'>) =>
  draft.item.status !== 'withdrawn' && draft.item.status !== 'pending'

/** Drafts save as they are written; scheduled and published items when Schedule or Update is pressed. */
export const autosaves = (draft: Pick<NewsDraft, 'item'>) => draft.item.status === 'draft'

interface NewsDraftState {
  draft: NewsDraft | null
  /** The server copy becomes the working copy: another item, a reload after a conflict. */
  open: (item: ProviderNewsDto) => void
  /**
   * The server copy read again (a job published the item, another tab saved it): its status and
   * times follow; the working copy stays unless it has no edit and the server's moved on.
   */
  refresh: (item: ProviderNewsDto) => void
  edit: (patch: Partial<NewsForm>) => void
  setRights: (confirmed: boolean) => void
  setGoLive: (patch: Partial<GoLive>) => void
  setSaving: (newsId: string, saving: boolean) => void
  /** A save, a publication or a withdrawal came back: the server copy and the version follow. */
  saved: (newsId: string, item: ProviderNewsDto, edits?: number) => void
  failed: (newsId: string, failure: NewsSaveFailure, errors?: Record<string, string[]>) => void
  /** Publish pressed: the editor and the publishing panel show every missing field. */
  check: (newsId: string) => void
}

/** The server's errors left once the fields they were about change. */
function withoutErrors(errors: Record<string, string[]>, fields: readonly string[]) {
  return Object.fromEntries(Object.entries(errors).filter(([field]) => !fields.includes(field)))
}

export const useNewsDraftStore = create<NewsDraftState>()((set) => {
  /** Applies to this item's draft only: the user may have opened another one since. */
  const update = (newsId: string, change: (draft: NewsDraft) => Partial<NewsDraft>) =>
    set(({ draft }) => (draft?.newsId === newsId ? { draft: { ...draft, ...change(draft) } } : {}))
  return {
    draft: null,
    open: (item) => set({ draft: fromServer(item) }),
    refresh: (item) =>
      set(({ draft }) => {
        if (draft?.newsId !== item.id || draft.item === item) return {}
        if (!isNewsDirty(draft) && !draft.saving && item.version !== draft.version)
          return { draft: fromServer(item) }
        return { draft: { ...draft, item } }
      }),
    edit: (patch) =>
      set(({ draft }) =>
        draft
          ? {
              draft: {
                ...draft,
                form: { ...draft.form, ...patch },
                edits: draft.edits + 1,
                serverErrors: withoutErrors(draft.serverErrors, Object.keys(patch)),
              },
            }
          : {},
      ),
    setRights: (rightsConfirmed) =>
      set(({ draft }) => (draft ? { draft: { ...draft, rightsConfirmed } } : {})),
    setGoLive: (patch) =>
      set(({ draft }) =>
        draft
          ? {
              draft: {
                ...draft,
                goLive: { ...draft.goLive, ...patch },
                serverErrors: withoutErrors(draft.serverErrors, ['publishAt']),
              },
            }
          : {},
      ),
    setSaving: (newsId, saving) => update(newsId, () => ({ saving })),
    saved: (newsId, item, edits) =>
      update(newsId, (draft) => ({
        item,
        saving: false,
        failure: null,
        failedEdits: null,
        serverErrors: {},
        version: item.version,
        savedAt: item.updatedAt,
        savedEdits: edits ?? draft.savedEdits,
      })),
    failed: (newsId, failure, errors = {}) =>
      update(newsId, (draft) => ({
        saving: false,
        failure,
        serverErrors: errors,
        failedEdits: draft.edits,
      })),
    check: (newsId) => update(newsId, () => ({ checked: true })),
  }
})
