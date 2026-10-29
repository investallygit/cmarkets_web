import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DataTable } from './DataTable'
import { createDataColumnHelper } from './dataColumns'

interface Quote {
  code: string
  last: number
}

const helper = createDataColumnHelper<Quote>()
const columns = helper.columns([
  helper.accessor('code', { header: 'Security' }),
  helper.accessor('last', { header: 'Last', meta: { align: 'right' } }),
])
const data: Quote[] = [
  { code: 'SEMC', last: 52500 },
  { code: 'BANGE', last: 26750 },
  { code: 'SIAT', last: 18500 },
]
const getRowId = (row: Quote) => row.code

function bodyCodes(): string[] {
  const [, ...bodyRows] = screen.getAllByRole('row')
  return bodyRows.map((row) => within(row).getAllByRole('cell')[0].textContent ?? '')
}

describe('DataTable', () => {
  it('sorts when a column header is clicked', async () => {
    const user = userEvent.setup()
    render(<DataTable data={data} columns={columns} getRowId={getRowId} />)
    expect(bodyCodes()).toEqual(['SEMC', 'BANGE', 'SIAT'])

    await user.click(screen.getByRole('button', { name: 'Security' }))
    expect(bodyCodes()).toEqual(['BANGE', 'SEMC', 'SIAT'])

    await user.click(screen.getByRole('button', { name: 'Security' }))
    expect(bodyCodes()).toEqual(['SIAT', 'SEMC', 'BANGE'])
  })

  it('reports the clicked row', async () => {
    const user = userEvent.setup()
    const onRowClick = vi.fn()
    render(<DataTable data={data} columns={columns} getRowId={getRowId} onRowClick={onRowClick} />)

    await user.click(screen.getByRole('cell', { name: 'BANGE' }))
    expect(onRowClick).toHaveBeenCalledWith({ code: 'BANGE', last: 26750 })
  })
})
