import type { SavedScreenDto } from '@/shared/api/contracts'

/** The saved screens of the screen 3 mockup; "High yield" holds the criteria shown there. */
export const SAVED_SCREEN_FIXTURES: readonly SavedScreenDto[] = [
  {
    id: 'screen-1',
    name: 'High yield',
    criteria: [
      { field: 'market', values: ['BVMAC'] },
      { field: 'marketCap', min: 10e9, max: null },
      { field: 'pe', min: 5, max: 15 },
      { field: 'dividendYield', min: 5, max: null },
      { field: 'roe', min: 12, max: null },
      { field: 'netDebtToEquity', min: null, max: 1 },
    ],
  },
  {
    id: 'screen-2',
    name: 'Banks',
    criteria: [
      { field: 'market', values: ['BVMAC'] },
      { field: 'sector', values: ['Banking'] },
    ],
  },
]
