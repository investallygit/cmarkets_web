import type { ImportDto, ImportType, PriceCorrectionDto } from '@/shared/api/contracts'
import { sharedStore } from '../db'
import type { CheckedRow } from '../lib/dataImport'

/** The uploads and the price corrections, as the mock stores them. */

export interface StoredImportRow extends CheckedRow {
  id: string
  checked: boolean
  edited: boolean
}

export type LiveValues = { open: number; high: number; low: number; last: number; volume: number }

export interface StoredImport {
  id: string
  type: ImportType
  fileName: string
  sessionDate: string
  columns: string[]
  status: 'ready' | 'published' | 'rolledBack' | 'discarded'
  uploadedAt: string
  uploadedById: string
  uploadedBy: string
  /** The format checks run until this time (ms), then the business checks until readyAt. */
  formatUntil: number
  readyAt: number
  publishedAt: string | null
  publishedBy: string | null
  rollback: ImportDto['rollback']
  replacesId: string | null
  /** Seeded with the prototype: its rows repeat the generated data of their day. */
  seed?: boolean
  /** Live prices or index values before a publication of today's session, for a rollback. */
  liveBefore?: Record<string, LiveValues | number>
  rows: StoredImportRow[]
}

export interface StoredCorrection extends PriceCorrectionDto {
  correctedById: string
}

/** While the store fills with its seeds, which read the generated data and nothing published. */
let seeding = false
let seedImports: () => StoredImport[] = () => []

export const isSeeding = () => seeding

/**
 * Set once by ./seeds. The seeded uploads go through the checks, which read what the published
 * uploads put in the database, which reads this store: the seeds come in here, not as an import.
 */
export function setImportSeeds(seed: () => StoredImport[]): void {
  seedImports = seed
}

export const importStore = sharedStore<StoredImport[]>('imports', () => {
  seeding = true
  try {
    return seedImports()
  } finally {
    seeding = false
  }
})

export const correctionStore = sharedStore<StoredCorrection[]>('priceCorrections', () => [])

export function findImport(id: string): StoredImport | undefined {
  return importStore.read().find((stored) => stored.id === id)
}
