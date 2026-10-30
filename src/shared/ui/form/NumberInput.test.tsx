import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import i18n from 'i18next'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Field } from './Field'
import { NumberInput } from './NumberInput'

const NBSP = '\u00a0'

function Price({ onChange }: { onChange: (value: number | null) => void }) {
  const [value, setValue] = useState<number | null>(101.4)
  return (
    <Field label="Clean price">
      <NumberInput
        value={value}
        onChange={(next) => {
          setValue(next)
          onChange(next)
        }}
      />
    </Field>
  )
}

describe('NumberInput', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('reports each number typed and reformats it on blur', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Price onChange={onChange} />)
    const input = screen.getByRole('textbox', { name: 'Clean price' })
    expect(input).toHaveValue('101.40')

    await user.clear(input)
    expect(onChange).toHaveBeenLastCalledWith(null)
    await user.type(input, '1250.5')
    expect(onChange).toHaveBeenLastCalledWith(1250.5)
    await user.tab()
    expect(input).toHaveValue('1,250.50')
  })

  it('keeps the last readable value when the text is not a number', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Price onChange={onChange} />)
    const input = screen.getByRole('textbox', { name: 'Clean price' })

    await user.type(input, 'x')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(onChange).not.toHaveBeenCalled()
    await user.tab()
    expect(input).toHaveValue('101.40')
    expect(input).not.toHaveAttribute('aria-invalid')
  })

  it('reads and shows numbers in French', async () => {
    await i18n.changeLanguage('fr')
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Price onChange={onChange} />)
    const input = screen.getByRole('textbox', { name: 'Clean price' })
    expect(input).toHaveValue('101,40')

    await user.clear(input)
    await user.type(input, '52 500,25')
    expect(onChange).toHaveBeenLastCalledWith(52500.25)
    await user.tab()
    expect(input).toHaveValue(`52${NBSP}500,25`)
  })
})
