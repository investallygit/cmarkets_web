import { createContext } from 'react'
import type { FrozenChartDto } from '@/shared/api/contracts'

/** The charts of the publication open, by id: a chart node only holds its id. */
export const FrozenChartsContext = createContext<ReadonlyMap<string, FrozenChartDto>>(new Map())
