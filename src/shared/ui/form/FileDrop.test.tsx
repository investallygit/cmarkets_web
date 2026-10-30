import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { describeAccept, isAccepted } from './fileAccept'
import { Field } from './Field'
import { FileDrop } from './FileDrop'

describe('accept lists', () => {
  it('match file extensions, whatever their case', () => {
    expect(isAccepted('cours_bvmac_20261028.CSV', '.csv,.xlsx')).toBe(true)
    expect(isAccepted('adjudications.xlsx', '.csv, .xlsx')).toBe(true)
    expect(isAccepted('note.pdf', '.csv,.xlsx')).toBe(false)
    expect(describeAccept('.csv,.xlsx')).toBe('CSV, XLSX')
  })
})

describe('FileDrop', () => {
  function renderDrop() {
    const onChange = vi.fn()
    render(
      <Field label="Daily prices file">
        <FileDrop file={null} onChange={onChange} accept=".csv,.xlsx" maxSize={1024} />
      </Field>,
    )
    // The browser would filter the picker on accept; drag and drop is not filtered.
    const user = userEvent.setup({ applyAccept: false })
    return { onChange, user, input: screen.getByLabelText('Daily prices file') }
  }

  it('passes on an accepted file', async () => {
    const { onChange, user, input } = renderDrop()
    const file = new File(['date;code;close'], 'cours_bvmac.csv', { type: 'text/csv' })
    await user.upload(input, file)
    expect(onChange).toHaveBeenCalledWith(file)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('refuses another type or a file that is too large', async () => {
    const { onChange, user, input } = renderDrop()
    await user.upload(input, new File(['%PDF'], 'note.pdf', { type: 'application/pdf' }))
    expect(screen.getByRole('alert')).toHaveTextContent('note.pdf: only CSV, XLSX files')

    await user.upload(input, new File(['x'.repeat(2048)], 'big.csv', { type: 'text/csv' }))
    expect(screen.getByRole('alert')).toHaveTextContent('big.csv is larger than 1.0')
    expect(onChange).not.toHaveBeenCalled()
  })
})
