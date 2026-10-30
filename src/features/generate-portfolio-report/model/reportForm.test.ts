import { describe, expect, it } from 'vitest'
import { initialReportForm, toReportRequest, validateReportForm } from './reportForm'

const TODAY = '2026-10-30'

describe('report form', () => {
  it('reports the year to date by default, from the last valuation of last year', () => {
    const form = initialReportForm('CEMAC Equity Fund', TODAY)
    expect(validateReportForm(form, TODAY)).toEqual({})
    expect(toReportRequest({ ...form, comments: ' Q3 review ' }, 'fr', TODAY)).toEqual({
      title: 'CEMAC Equity Fund',
      from: '2025-12-31',
      to: TODAY,
      sections: ['positions', 'performance', 'risk', 'income'],
      comments: 'Q3 review',
      language: 'fr',
    })
    expect(toReportRequest({ ...form, period: 'inception' }, 'en', TODAY).from).toBeNull()
  })

  it('needs a title, a section and, for a custom period, its two dates in order', () => {
    const form = initialReportForm('Fund', TODAY)
    expect(validateReportForm({ ...form, title: ' ', sections: [] }, TODAY)).toEqual({
      title: 'required',
      sections: 'required',
    })
    expect(
      validateReportForm(
        { ...form, period: 'custom', from: '2026-10-01', to: '2026-09-30' },
        TODAY,
      ),
    ).toEqual({ from: 'order' })
    expect(
      validateReportForm(
        { ...form, period: 'custom', from: '2026-01-01', to: '2026-11-02' },
        TODAY,
      ),
    ).toEqual({ to: 'future' })
  })

  it('keeps the sections in the order of the report', () => {
    const form = {
      ...initialReportForm('Fund', TODAY),
      sections: ['income' as const, 'positions' as const],
    }
    expect(toReportRequest(form, 'en', TODAY).sections).toEqual(['positions', 'income'])
  })
})
