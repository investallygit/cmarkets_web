import { describe, expect, it } from 'vitest'
import { formatMacroAxis, formatMacroFigure } from './macroFigures'
import { macroPeriodRange } from './macroPeriods'

const NBSP = ' '

describe('formatMacroFigure', () => {
  it('writes the screen 25 tiles with their unit, as the mockup', () => {
    expect(formatMacroFigure(3.6, 'percent', 'en', 'tile')).toBe('3.6%')
    expect(formatMacroFigure(1720, 'usd', 'en', 'tile')).toBe('$1,720')
    expect(formatMacroFigure(29_100_000, 'people', 'en', 'tile')).toBe(`29.1${NBSP}M`)
    expect(formatMacroFigure(1_240_000_000, 'people', 'en', 'tile')).toBe(`1,240${NBSP}M`)
    expect(formatMacroFigure(51_326_760_112.5, 'usd', 'en', 'tile')).toBe(`$51.3${NBSP}Bn`)
  })

  it('writes the table bare, its row naming the unit', () => {
    expect(formatMacroFigure(-2.8, 'percent', 'en', 'table')).toBe('-2.8')
    expect(formatMacroFigure(8450, 'usd', 'en', 'table')).toBe('8,450')
    expect(formatMacroFigure(1_900_000, 'people', 'en', 'table')).toBe('1.9')
    expect(formatMacroFigure(-48_000, 'people', 'en', 'table')).toBe('-48,000')
  })

  it('writes French with its own separators and the currency after the amount', () => {
    expect(formatMacroFigure(3.6, 'percent', 'fr', 'tile')).toBe(`3,6${NBSP}%`)
    expect(formatMacroFigure(1720, 'usd', 'fr', 'tile')).toBe(`1${NBSP}720${NBSP}$`)
    expect(formatMacroFigure(29_100_000, 'people', 'fr', 'tile')).toBe(`29,1${NBSP}M`)
  })

  it('writes the other units with one decimal, square kilometres whole', () => {
    expect(formatMacroFigure(61.2, 'years', 'en', 'tile')).toBe('61.2')
    expect(formatMacroFigure(475_440, 'squareKm', 'en', 'tile')).toBe(`475,440${NBSP}km²`)
    expect(formatMacroFigure(0.31, 'tonnes', 'en', 'tile')).toBe(`0.3${NBSP}t`)
  })
})

describe('formatMacroAxis', () => {
  it('keeps the ticks short', () => {
    expect(formatMacroAxis(5, 'percent', 'en')).toBe('5')
    expect(formatMacroAxis(-2.5, 'percent', 'en')).toBe('-2.5')
    expect(formatMacroAxis(120, 'index', 'en')).toBe('120')
    expect(formatMacroAxis(2_500_000, 'people', 'en')).toBe(`2.5${NBSP}M`)
    expect(formatMacroAxis(12_000, 'usd', 'en')).toBe(`12.0${NBSP}K`)
    expect(formatMacroAxis(500, 'usd', 'en')).toBe('500')
  })
})

describe('macroPeriodRange', () => {
  it('spans the mockup s 2010 to 2025 by default and every year since 1960 at most', () => {
    expect(macroPeriodRange('15Y', 2025)).toEqual({ from: 2010, to: 2025 })
    expect(macroPeriodRange('10Y', 2025)).toEqual({ from: 2015, to: 2025 })
    expect(macroPeriodRange('MAX', 2025)).toEqual({ from: 1960, to: 2025 })
    expect(macroPeriodRange('30Y', 1980)).toEqual({ from: 1960, to: 1980 })
  })
})
