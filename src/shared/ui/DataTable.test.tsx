import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
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

  it('moves from row to row with the arrows, and opens a row with Enter', async () => {
    const user = userEvent.setup()
    const onRowDoubleClick = vi.fn()
    function Selectable() {
      const [selected, setSelected] = useState<string | null>(null)
      return (
        <DataTable
          data={data}
          columns={columns}
          getRowId={getRowId}
          selectedRowId={selected}
          onRowClick={(row) => setSelected(row.code)}
          onRowDoubleClick={onRowDoubleClick}
          enableSorting={false}
        />
      )
    }
    render(<Selectable />)
    // The table is the first stop of the keyboard: the headers do not sort.
    await user.tab()
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowUp}')
    await user.keyboard('{Enter}')
    expect(onRowDoubleClick).toHaveBeenCalledWith({ code: 'BANGE', last: 26750 })
    // Past the last row, the selection stays there.
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{Enter}')
    expect(onRowDoubleClick).toHaveBeenLastCalledWith({ code: 'SIAT', last: 18500 })
  })

  it('marks the selected row as the current one for screen readers', () => {
    render(
      <DataTable
        data={data}
        columns={columns}
        getRowId={getRowId}
        selectedRowId="BANGE"
        onRowClick={() => {}}
      />,
    )
    const current = screen
      .getAllByRole('row')
      .filter((row) => row.getAttribute('aria-current') === 'true')
    expect(current.map((row) => within(row).getAllByRole('cell')[0].textContent)).toEqual(['BANGE'])
  })

  it('opens the menu of the selected row from the keyboard, and says which row', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    function Selectable() {
      const [selected, setSelected] = useState<string | null>(null)
      return (
        <DataTable
          data={data}
          columns={columns}
          getRowId={getRowId}
          selectedRowId={selected}
          onRowClick={(row) => setSelected(row.code)}
          rowMenu={(row) => [{ id: 'open', label: `Open ${row.code}`, onSelect }]}
          enableSorting={false}
        />
      )
    }
    render(<Selectable />)
    await user.tab()
    await user.keyboard('{ArrowDown}{ArrowDown}')
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('BANGE, 26750'))
    await user.keyboard('{Shift>}{F10}{/Shift}')
    expect(screen.getByRole('menuitem', { name: 'Open BANGE' })).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    // The menu key does the same; Enter picks the entry.
    await user.keyboard('{ContextMenu}')
    await user.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledOnce()
  })

  it('moves a cursor of its own where the rows are not selected', async () => {
    const user = userEvent.setup()
    const onRowDoubleClick = vi.fn()
    render(
      <DataTable
        data={data}
        columns={columns}
        getRowId={getRowId}
        onRowDoubleClick={onRowDoubleClick}
        enableSorting={false}
      />,
    )
    await user.tab()
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}')
    expect(onRowDoubleClick).toHaveBeenCalledWith({ code: 'BANGE', last: 26750 })
    // The export entries come from the keyboard too.
    await user.keyboard('{ContextMenu}')
    expect(screen.getByRole('menuitem', { name: 'Export to Excel' })).toHaveFocus()
  })

  it('reads its cells again when the columns change, the data the same (B41, B80)', () => {
    const labelled = (label: string) =>
      helper.columns([
        helper.accessor('code', { header: 'Security' }),
        helper.accessor((quote) => `${label} ${quote.last}`, { id: 'label', header: 'Label' }),
      ])
    const { rerender } = render(
      <DataTable data={data} columns={labelled('Real')} getRowId={getRowId} />,
    )
    expect(screen.getByRole('cell', { name: 'Real 52500' })).toBeInTheDocument()
    // The language switched, or the clock ticked: the columns change, the rows do not.
    rerender(<DataTable data={data} columns={labelled('Réel')} getRowId={getRowId} />)
    expect(screen.getByRole('cell', { name: 'Réel 52500' })).toBeInTheDocument()
    expect(screen.queryByRole('cell', { name: 'Real 52500' })).not.toBeInTheDocument()
  })

  it('tells screen readers the column sorted and which way (B43)', async () => {
    const user = userEvent.setup()
    render(<DataTable data={data} columns={columns} getRowId={getRowId} />)
    const security = screen.getByRole('columnheader', { name: 'Security' })
    expect(security).toHaveAttribute('aria-sort', 'none')
    await user.click(screen.getByRole('button', { name: 'Security' }))
    expect(security).toHaveAttribute('aria-sort', 'ascending')
    expect(screen.getByRole('columnheader', { name: 'Last' })).toHaveAttribute('aria-sort', 'none')
    await user.click(screen.getByRole('button', { name: 'Security' }))
    expect(security).toHaveAttribute('aria-sort', 'descending')
  })

  it('sorts words as a dictionary does, accents and case aside (B94)', async () => {
    const user = userEvent.setup()
    const papers: Quote[] = [
      { code: 'TCHAD MATIN', last: 1 },
      { code: 'ÉCO HEBDO', last: 2 },
      { code: 'cameroon tribune', last: 3 },
      { code: 'DAILY K', last: 4 },
    ]
    render(<DataTable data={papers} columns={columns} getRowId={getRowId} />)
    await user.click(screen.getByRole('button', { name: 'Security' }))
    expect(bodyCodes()).toEqual(['cameroon tribune', 'DAILY K', 'ÉCO HEBDO', 'TCHAD MATIN'])
  })

  it('turns a server order back on the third click, never asking for none (B81)', async () => {
    const user = userEvent.setup()
    const onSortingChange = vi.fn()
    render(
      <DataTable
        data={data}
        columns={columns}
        getRowId={getRowId}
        sorting={[{ id: 'code', desc: true }]}
        onSortingChange={onSortingChange}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Security' }))
    expect(onSortingChange).toHaveBeenCalledWith([{ id: 'code', desc: false }])
  })
})
