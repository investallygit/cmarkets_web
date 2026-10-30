import type { CalendarEventType, DividendDto } from '@/shared/api/contracts'

export interface ProfileFixture {
  isin: string
  issuer: string
  sharesOutstanding: number | null
  freeFloatPct: number | null
  high52w: number
  low52w: number
  beta1y: number | null
  pe: number | null
  yieldPct: number | null
  /** Newest first. */
  dividends: Omit<DividendDto, 'currency'>[]
  /** Holders and their share of the capital, the free float last. */
  shareholders: { name: string; pct: number }[]
  nextEvent: { type: CalendarEventType; title: string; date: string } | null
}

/** Five yearly dividends, the latest first, each about 5% above the year before. */
function dividendsFrom(
  amount: number,
  yieldPct: number,
  paymentMonthDay: string,
): Omit<DividendDto, 'currency'>[] {
  return [2026, 2025, 2024, 2023, 2022].map((fiscalYear, index) => {
    const paymentDate = `${fiscalYear}-${paymentMonthDay}`
    // Ex-dividend two weeks before the payment.
    const exDate = new Date(Date.parse(`${paymentDate}T12:00:00Z`) - 14 * 86_400_000)
    return {
      fiscalYear,
      kind: 'final',
      amount: Math.round(amount / 1.05 ** index / 5) * 5,
      exDate: exDate.toISOString().slice(0, 10),
      paymentDate,
      yieldPct: Number((yieldPct + 0.2 * index).toFixed(1)),
    }
  })
}

function holders(reference: string, referencePct: number, freeFloatPct: number) {
  const institutions = Number(((100 - referencePct - freeFloatPct) * 0.7).toFixed(1))
  return [
    { name: reference, pct: referencePct },
    { name: 'Institutional investors', pct: institutions },
    {
      name: 'Employees and management',
      pct: Number((100 - referencePct - freeFloatPct - institutions).toFixed(1)),
    },
    { name: 'Free float', pct: freeFloatPct },
  ]
}

/** Sample figures: SEMC follows the screen 2 mockup, the others are made up. */
// prettier-ignore
export const PROFILE_FIXTURES: Record<string, ProfileFixture> = {
  SEMC: {
    isin: 'CM0000010011', issuer: 'Société des Eaux Minérales du Cameroun',
    sharesOutstanding: 1_600_000, freeFloatPct: 18.4, high52w: 54_000, low52w: 44_100,
    beta1y: 0.72, pe: 11.4, yieldPct: 6.2,
    dividends: [
      { fiscalYear: 2026, kind: 'final', amount: 3260, exDate: '2026-06-24', paymentDate: '2026-07-08', yieldPct: 6.2 },
      { fiscalYear: 2025, kind: 'final', amount: 3100, exDate: '2025-06-25', paymentDate: '2025-07-09', yieldPct: 6.4 },
      { fiscalYear: 2024, kind: 'final', amount: 2950, exDate: '2024-06-12', paymentDate: '2024-06-26', yieldPct: 6.6 },
      { fiscalYear: 2023, kind: 'final', amount: 2800, exDate: '2023-06-28', paymentDate: '2023-07-12', yieldPct: 6.9 },
      { fiscalYear: 2022, kind: 'final', amount: 2650, exDate: '2022-06-29', paymentDate: '2022-07-13', yieldPct: 7.1 },
    ],
    shareholders: holders('Reference industrial shareholder', 61.6, 18.4),
    nextEvent: { type: 'earnings', title: 'Annual results', date: '2027-03-30' },
  },
  SAFACAM: {
    isin: 'CM0000010029', issuer: 'Société Africaine Forestière et Agricole du Cameroun',
    sharesOutstanding: 4_100_000, freeFloatPct: 25, high52w: 41_500, low52w: 35_200,
    beta1y: 0.85, pe: 10.2, yieldPct: 5.9,
    dividends: dividendsFrom(2300, 5.9, '11-14'),
    shareholders: holders('Agro-industrial group', 55, 25),
    nextEvent: { type: 'dividend', title: 'Ex-dividend date', date: '2026-10-31' },
  },
  SOCAPALM: {
    isin: 'CM0000010037', issuer: 'Société Camerounaise de Palmeraies',
    sharesOutstanding: 4_575_000, freeFloatPct: 21.5, high52w: 43_900, low52w: 36_700,
    beta1y: 0.78, pe: 9.6, yieldPct: 6.8,
    dividends: dividendsFrom(2800, 6.8, '07-22'),
    shareholders: holders('Plantation group', 60.5, 21.5),
    nextEvent: { type: 'earnings', title: 'Half-year results', date: '2026-11-20' },
  },
  SIAT: {
    isin: 'GA0000010045', issuer: 'SIAT Gabon',
    sharesOutstanding: 2_000_000, freeFloatPct: 15, high52w: 21_400, low52w: 17_900,
    beta1y: 1.05, pe: 12.8, yieldPct: 4.1,
    dividends: dividendsFrom(760, 4.1, '08-20'),
    shareholders: holders('Agro-industrial holding', 68, 15),
    nextEvent: { type: 'earnings', title: 'Quarterly production', date: '2027-01-25' },
  },
  BANGE: {
    isin: 'GQ0000010052', issuer: 'Banque Nationale de Guinée Équatoriale',
    sharesOutstanding: 8_000_000, freeFloatPct: 20, high52w: 27_300, low52w: 22_800,
    beta1y: 0.64, pe: 7.9, yieldPct: 7.4,
    dividends: dividendsFrom(1980, 7.4, '06-26'),
    shareholders: holders('State of Equatorial Guinea', 51, 20),
    nextEvent: { type: 'meeting', title: 'Annual general meeting', date: '2026-11-01' },
  },
  REGIONALE: {
    isin: 'CM0000010060', issuer: 'La Régionale',
    sharesOutstanding: 6_800_000, freeFloatPct: 30, high52w: 18_200, low52w: 15_600,
    beta1y: 0.92, pe: 8.3, yieldPct: 5.4,
    dividends: dividendsFrom(940, 5.4, '07-17'),
    shareholders: holders('Founding shareholders', 45, 30),
    nextEvent: { type: 'earnings', title: 'Annual results', date: '2027-04-15' },
  },
  'SCG-RE': {
    isin: 'GA0000010078', issuer: 'Société Commerciale Gabonaise de Réassurance',
    sharesOutstanding: 3_500_000, freeFloatPct: 22, high52w: 23_400, low52w: 20_100,
    beta1y: 0.58, pe: 9.1, yieldPct: 6,
    dividends: dividendsFrom(1310, 6, '12-15'),
    shareholders: holders('Insurance group', 58, 22),
    nextEvent: { type: 'dividend', title: 'Dividend payment', date: '2026-12-15' },
  },
  'ECMR-6.25-2029': {
    isin: 'CM0000020010', issuer: 'Republic of Cameroon',
    sharesOutstanding: null, freeFloatPct: null, high52w: 102.1, low52w: 99.6,
    // Yield of the spec section 14.1 test case B at a clean price of 101.40.
    beta1y: null, pe: null, yieldPct: 5.24,
    dividends: [], shareholders: [],
    nextEvent: { type: 'maturity', title: 'Coupon and partial redemption', date: '2026-11-04' },
  },
  'GAB-6.50-2028': {
    isin: 'GA0000020028', issuer: 'Gabonese Republic',
    sharesOutstanding: null, freeFloatPct: null, high52w: 100.8, low52w: 98.4,
    beta1y: null, pe: null, yieldPct: 6.59,
    dividends: [], shareholders: [],
    nextEvent: { type: 'maturity', title: 'Annual coupon', date: '2027-06-15' },
  },
}
