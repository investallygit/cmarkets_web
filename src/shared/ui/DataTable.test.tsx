import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DataTable } from './DataTable'
import { createDataColumnHelper } from './dataColumns'
import { TableExportContext } from './tableExport'

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

  it('leaves the order to the server when it sorts the pages', async () => {
    const user = userEvent.setup()
    const onSortingChange = vi.fn()
    render(
      <DataTable
        data={data}
        columns={columns}
        getRowId={getRowId}
        sorting={[{ id: 'last', desc: true }]}
        onSortingChange={onSortingChange}
      />,
    )
    // The rows stay as they came, with the arrow of the order asked for.
    expect(bodyCodes()).toEqual(['SEMC', 'BANGE', 'SIAT'])
    await user.click(screen.getByRole('button', { name: 'Security' }))
    expect(onSortingChange).toHaveBeenCalledWith([{ id: 'code', desc: false }])
    expect(bodyCodes()).toEqual(['SEMC', 'BANGE', 'SIAT'])
  })

  it('keeps the footer row last, whatever the sorting', async () => {
    const user = userEvent.setup()
    render(
      <DataTable
        data={data}
        columns={columns}
        getRowId={getRowId}
        footer={{ cells: { code: 'Cash XAF', last: '84,908,200' } }}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Security' }))
    expect(bodyCodes()).toEqual(['BANGE', 'SEMC', 'SIAT', 'Cash XAF'])
    await user.click(screen.getByRole('button', { name: 'Security' }))
    expect(bodyCodes()).toEqual(['SIAT', 'SEMC', 'BANGE', 'Cash XAF'])
  })

  it('offers Excel and CSV export, unless the user may not export', async () => {
    const user = userEvent.setup()
    const table = <DataTable data={data} columns={columns} getRowId={getRowId} />
    const { unmount } = render(table)
    await user.pointer({ keys: '[MouseRight]', target: screen.getByRole('cell', { name: 'SEMC' }) })
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Export to Excel',
      'Export to CSV',
    ])
    unmount()

    render(<TableExportContext.Provider value={false}>{table}</TableExportContext.Provider>)
    await user.pointer({ keys: '[MouseRight]', target: screen.getByRole('cell', { name: 'SEMC' }) })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('reports the clicked row', async () => {
    const user = userEvent.setup()
    const onRowClick = vi.fn()
    render(<DataTable data={data} columns={columns} getRowId={getRowId} onRowClick={onRowClick} />)

    await user.click(screen.getByRole('cell', { name: 'BANGE' }))
    expect(onRowClick).toHaveBeenCalledWith({ code: 'BANGE', last: 26750 })
  })
})
