import type { DocumentDto } from '@/shared/api/contracts'

/** Issuer documents; SEMC's are those of the screen 2 mockup. Files are generated on request. */
// prettier-ignore
export const DOCUMENTS: DocumentDto[] = [
  { id: 'doc-semc-h1-2026', type: 'financial-statements', title: 'Half-year financial statements', publishedAt: '2026-09-30T15:00:00Z', source: 'SEMC', securityIds: ['SEMC'], pages: 18, sizeBytes: 1_480_000 },
  { id: 'doc-bvmac-semc-ex-dividend', type: 'notice', title: 'BVMAC notice — ex-dividend', publishedAt: '2026-07-02T09:00:00Z', source: 'BVMAC', securityIds: ['SEMC'], pages: 1, sizeBytes: 96_000 },
  { id: 'doc-semc-annual-2025', type: 'annual-report', title: '2025 annual report', publishedAt: '2026-06-15T15:00:00Z', source: 'SEMC', securityIds: ['SEMC'], pages: 64, sizeBytes: 5_200_000 },
  { id: 'doc-semc-dividend-2026', type: 'information-note', title: 'Information note — 2026 dividend', publishedAt: '2026-05-20T15:00:00Z', source: 'SEMC', securityIds: ['SEMC'], pages: 6, sizeBytes: 420_000 },
  { id: 'doc-semc-articles', type: 'articles', title: 'Articles of association', publishedAt: '2024-01-12T10:00:00Z', source: 'SEMC', securityIds: ['SEMC'], pages: 22, sizeBytes: 880_000 },
  { id: 'doc-siat-production-q3', type: 'release', title: 'Quarterly production release', publishedAt: '2026-10-27T16:00:00Z', source: 'SIAT', securityIds: ['SIAT'], pages: 2, sizeBytes: 150_000 },
  { id: 'doc-regionale-h1-2026', type: 'financial-statements', title: 'Half-year report', publishedAt: '2026-10-27T15:00:00Z', source: 'REGIONALE', securityIds: ['REGIONALE'], pages: 24, sizeBytes: 1_900_000 },
  { id: 'doc-socapalm-board-dividend', type: 'release', title: 'Board report on the dividend', publishedAt: '2026-10-25T15:00:00Z', source: 'SOCAPALM', securityIds: ['SOCAPALM'], pages: 3, sizeBytes: 210_000 },
  { id: 'doc-bange-agm-notice', type: 'notice', title: 'Notice of annual general meeting', publishedAt: '2026-10-15T09:00:00Z', source: 'BANGE', securityIds: ['BANGE'], pages: 4, sizeBytes: 260_000 },
  { id: 'doc-safacam-dividend-2026', type: 'information-note', title: 'Information note — 2026 dividend', publishedAt: '2026-10-10T15:00:00Z', source: 'SAFACAM', securityIds: ['SAFACAM'], pages: 5, sizeBytes: 380_000 },
  { id: 'doc-beac-policy-rates', type: 'decision', title: 'BEAC decision — policy rates', publishedAt: '2026-09-29T14:00:00Z', source: 'BEAC', securityIds: [], pages: 2, sizeBytes: 120_000 },
  { id: 'doc-scgre-annual-2025', type: 'annual-report', title: '2025 annual report', publishedAt: '2026-06-25T15:00:00Z', source: 'SCG-RE', securityIds: ['SCG-RE'], pages: 58, sizeBytes: 4_700_000 },
  { id: 'doc-bange-annual-2025', type: 'annual-report', title: '2025 annual report', publishedAt: '2026-05-30T15:00:00Z', source: 'BANGE', securityIds: ['BANGE'], pages: 72, sizeBytes: 6_100_000 },
  { id: 'doc-ecmr-information-note', type: 'information-note', title: 'Information note — Republic of Cameroon 6.25% 2025-2029', publishedAt: '2024-10-15T10:00:00Z', source: 'CAMEROON', securityIds: ['ECMR-6.25-2029'], pages: 48, sizeBytes: 2_300_000 },
  { id: 'doc-cosumaf-ecmr-approval', type: 'decision', title: 'COSUMAF approval of the bond issue', publishedAt: '2024-10-01T10:00:00Z', source: 'COSUMAF', securityIds: ['ECMR-6.25-2029'], pages: 2, sizeBytes: 110_000 },
  { id: 'doc-gab-information-note', type: 'information-note', title: 'Information note — Gabonese Republic 6.50% 2028', publishedAt: '2023-06-01T10:00:00Z', source: 'GABON', securityIds: ['GAB-6.50-2028'], pages: 44, sizeBytes: 2_100_000 },
]
