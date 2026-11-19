import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ImportDto, ImportRowDto, ImportTypeDto } from '@/shared/api/contracts'
import { dataAdminApi } from '@/shared/api/endpoints'
import { CurrentUploadPanel } from './CurrentUploadPanel'

// The live site's "Curves and rates" of 6 November 2026: the CEMAC sovereign yields replaced that
// file (ROADMAP step 38), and GET /data/import-types lists only the files uploaded today.
const curves: ImportDto = {
  id: 'curves-1',
  type: 'curves',
  fileName: 'courbes_beac_20261106.csv',
  sessionDate: '2026-11-06',
  columns: ['date', 'country', 'maturity', 'rate'],
  status: 'published',
  counts: { read: 2, new: 2, changed: 0, unchanged: 0, alerts: 0, alertsChecked: 0, errors: 0 },
  uploadedAt: '2026-11-06T16:10:00Z',
  uploadedBy: 'A. Mbarga',
  publishedAt: '2026-11-06T16:12:00Z',
  publishedBy: 'A. Mbarga',
  rollback: null,
  replacesId: null,
}

const point = (line: number, maturity: string, rate: number): ImportRowDto => ({
  id: String(line),
  line,
  values: { date: '2026-11-06', country: 'CF', maturity, rate },
  stored: null,
  status: 'new',
  issues: [],
  checked: false,
  edited: false,
})

const typesToday: ImportTypeDto[] = [
  {
    type: 'cemac-sov-yields',
    frequency: 'weekly',
    columns: [
      { name: 'date', kind: 'date', required: true },
      { name: 'country', kind: 'text', required: true },
      { name: 'tenor', kind: 'text', required: true },
      { name: 'yield', kind: 'rate', required: true },
    ],
    checks: [],
    changeThreshold: null,
  },
]

afterEach(() => vi.restoreAllMocks())

describe('CurrentUploadPanel', () => {
  it('shows the rows of an upload whose file is no longer uploaded, as its template had them', async () => {
    vi.spyOn(dataAdminApi, 'import').mockResolvedValue(curves)
    vi.spyOn(dataAdminApi, 'importTypes').mockResolvedValue(typesToday)
    vi.spyOn(dataAdminApi, 'rows').mockResolvedValue({
      items: [point(2, '3M', 6), point(3, '6M', 6.6)],
      page: 1,
      pageSize: 200,
      totalCount: 2,
    })

    render(
      <QueryClientProvider client={new QueryClient()}>
        <CurrentUploadPanel importId="curves-1" sessionDate={null} onOpen={() => {}} />
      </QueryClientProvider>,
    )

    // The tenor as written, the rate in percent: the old template's columns, not "Loading" for ever.
    const sixMonths = await screen.findByRole('row', { name: /6M/ })
    expect(within(sixMonths).getByText('6.60%')).toBeInTheDocument()
    expect(within(sixMonths).getByText('06/11/2026')).toBeInTheDocument()
    expect(screen.getByRole('row', { name: /3M/ })).toHaveTextContent('6.00%')
    expect(screen.queryByText(/^Loading/)).not.toBeInTheDocument()
  })
})
