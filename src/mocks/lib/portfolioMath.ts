/**
 * Portfolio performance and risk of spec sections 14.2 and 14.3, as CMarket.Domain computes them.
 * Returns are fractions here (0.02), percent in the API.
 */

export interface Lot {
  quantity: number
  /** Per unit of price: per share, or per 100 of principal for a bond. */
  averageCost: number
}

/**
 * Weighted average cost, fees included: AvgCost = (q × AvgCost + q_b × p_b + fees) / (q + q_b).
 * `unitValue` is the value of one unit of price per unit of quantity (1 for a share, the principal
 * outstanding / 100 for a bond), so the fees, an amount, are spread in price units.
 */
export function buyLot(
  lot: Lot,
  quantity: number,
  price: number,
  fees: number,
  unitValue = 1,
): Lot {
  const total = lot.quantity + quantity
  return {
    quantity: total,
    averageCost: (lot.quantity * lot.averageCost + quantity * price + fees / unitValue) / total,
  }
}

/** Realized gain = q_s × (p_s − AvgCost) − fees; the average cost of what is left is unchanged. */
export function sellGain(
  lot: Lot,
  quantity: number,
  price: number,
  fees: number,
  unitValue = 1,
): number {
  return quantity * (price - lot.averageCost) * unitValue - fees
}

/**
 * Daily returns r_t = V_t / (V_t−1 + F_t) − 1, the external flows F_t (deposits positive,
 * withdrawals negative) taken at the start of the day. The first value is the base: no return.
 */
export function dailyReturns(values: readonly number[], flows: readonly number[]): number[] {
  const returns: number[] = []
  for (let t = 1; t < values.length; t++) {
    const base = values[t - 1] + flows[t]
    returns.push(base > 0 ? values[t] / base - 1 : 0)
  }
  return returns
}

/** TWR = Π (1 + r_t) − 1. */
export function chainReturns(returns: readonly number[]): number {
  return returns.reduce((product, r) => product * (1 + r), 1) - 1
}

/** (1 + TWR)^(365 / days) − 1, only for periods longer than 365 days. */
export function annualize(totalReturn: number, days: number): number | null {
  return days > 365 ? (1 + totalReturn) ** (365 / days) - 1 : null
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

/** Sample covariance, n − 1 in the denominator. */
export function sampleCovariance(a: readonly number[], b: readonly number[]): number {
  if (a.length < 2) return 0
  const meanA = mean(a)
  const meanB = mean(b)
  let sum = 0
  for (let index = 0; index < a.length; index++) sum += (a[index] - meanA) * (b[index] - meanB)
  return sum / (a.length - 1)
}

export function sampleStdDev(values: readonly number[]): number {
  return Math.sqrt(sampleCovariance(values, values))
}

/** σ = sample standard deviation(r_t) × √A. */
export function volatility(returns: readonly number[], sessionsPerYear: number): number {
  return sampleStdDev(returns) * Math.sqrt(sessionsPerYear)
}

export interface Drawdown {
  /** min_t (V_t / max_{s≤t} V_s − 1), zero or negative. */
  value: number
  /** Indices of the peak and of the trough in the series; -1 without a fall. */
  peak: number
  trough: number
}

/** Maximum drawdown of a value series, with the peak and trough positions. */
export function maxDrawdown(values: readonly number[]): Drawdown {
  let peak = 0
  let worst: Drawdown = { value: 0, peak: -1, trough: -1 }
  for (let t = 1; t < values.length; t++) {
    if (values[t] > values[peak]) peak = t
    const fall = values[t] / values[peak] - 1
    if (fall < worst.value) worst = { value: fall, peak, trough: t }
  }
  return worst
}

/** Value index from returns, starting at `start`: start × Π (1 + r_s). */
export function valueIndex(returns: readonly number[], start = 1): number[] {
  const index = [start]
  for (const r of returns) index.push(index[index.length - 1] * (1 + r))
  return index
}

/** β = Cov(r_p, r_b) / Var(r_b), on the same dates. */
export function beta(portfolio: readonly number[], benchmark: readonly number[]): number | null {
  const variance = sampleCovariance(benchmark, benchmark)
  return variance === 0 ? null : sampleCovariance(portfolio, benchmark) / variance
}

/** R_a = (Π (1 + r_t))^(A / N) − 1. */
export function annualizedReturn(returns: readonly number[], sessionsPerYear: number): number {
  return (1 + chainReturns(returns)) ** (sessionsPerYear / returns.length) - 1
}

/** TE = standard deviation(r_p − r_b) × √A. */
export function trackingError(
  portfolio: readonly number[],
  benchmark: readonly number[],
  sessionsPerYear: number,
): number {
  return volatility(
    portfolio.map((r, index) => r - benchmark[index]),
    sessionsPerYear,
  )
}

/** Percentile with linear interpolation between the closest ranks. */
export function percentile(values: readonly number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b)
  const rank = (sorted.length - 1) * p
  const lower = Math.floor(rank)
  const upper = Math.min(lower + 1, sorted.length - 1)
  return sorted[lower] + (rank - lower) * (sorted[upper] - sorted[lower])
}

/** 1-day historical VaR 95% = − 5th percentile (r_t), as a fraction of the value. */
export function historicalVar(returns: readonly number[], confidence = 0.95): number {
  return -percentile(returns, 1 - confidence)
}

/** Concentration index HHI = Σ Weight_i², weights as fractions. */
export function herfindahl(weights: readonly number[]): number {
  return weights.reduce((sum, weight) => sum + weight * weight, 0)
}

export interface DatedFlow {
  /** Days from the start. */
  days: number
  /** Deposits positive, withdrawals negative. */
  amount: number
}

/**
 * Money-weighted return: the IRR solving
 * 0 = −V_0 − Σ F_j (1 + IRR)^(−t_j / 365) + V_T (1 + IRR)^(−T / 365), by Newton-Raphson as for
 * the bond yield, then by bisection. Null when no rate fits.
 */
export function moneyWeightedReturn(
  startValue: number,
  flows: readonly DatedFlow[],
  endValue: number,
  endDays: number,
): number | null {
  const npv = (rate: number) =>
    -startValue -
    flows.reduce((sum, flow) => sum + flow.amount * (1 + rate) ** (-flow.days / 365), 0) +
    endValue * (1 + rate) ** (-endDays / 365)
  const slope = (rate: number) =>
    flows.reduce(
      (sum, flow) => sum + (flow.amount * flow.days * (1 + rate) ** (-flow.days / 365 - 1)) / 365,
      0,
    ) -
    (endValue * endDays * (1 + rate) ** (-endDays / 365 - 1)) / 365

  let rate = 0.05
  for (let iteration = 0; iteration < 50; iteration++) {
    const value = npv(rate)
    if (Math.abs(value) < 1e-6) return rate
    const derivative = slope(rate)
    if (derivative === 0) break
    const next = rate - value / derivative
    if (!Number.isFinite(next) || next <= -0.99) break
    rate = next
  }
  let low = -0.99
  let high = 10
  if (npv(low) * npv(high) > 0) return null
  for (let iteration = 0; iteration < 200; iteration++) {
    const middle = (low + high) / 2
    if (npv(low) * npv(middle) <= 0) high = middle
    else low = middle
  }
  return (low + high) / 2
}
