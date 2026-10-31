import type {
  FrozenChartDto,
  Outlook,
  PriceBarDto,
  PublicationPricingDto,
  PublicationRating,
  PublicationRulesDto,
  PublicationStatus,
  Recommendation,
  RichTextDoc,
  RichTextNode,
  SubjectType,
} from '@/shared/api/contracts'
import { addDays, addMonths } from '@/shared/lib/isoDate'
import { CHART_NODE, estimatePages } from '@/shared/lib/richText'
import { createRandom, hashString } from '../lib/random'
import {
  HOLD_BAND_PCT,
  monthOf,
  type MonthStats,
  type StoredAnalyst,
  type StoredContent,
  type StoredPublication,
} from '../lib/research'

/** What the sample library needs from the market data. */
export interface ResearchMarket {
  today: string
  security(
    id: string,
  ): { id: string; code: string; name: string; sector: string; country: string } | undefined
  /** The close of the last session on or before a day. */
  closeOn(id: string, day: string): number | undefined
  bars(id: string, from: string, to: string, interval: '1d' | '1w'): PriceBarDto[]
}

/** Set by the Admin (spec section 13); the screen 7 mockup shows the range and the moderation. */
export const PUBLICATION_RULES: PublicationRulesDto = {
  currency: 'XAF',
  minPrice: 2000,
  maxPrice: 100_000,
  commissionPct: 20,
  moderation: 'after',
}

export const COUNTRY_NAMES: Record<string, string> = {
  CM: 'Cameroon',
  GA: 'Gabon',
  CG: 'Congo',
  TD: 'Chad',
  CF: 'Central African Republic',
  GQ: 'Equatorial Guinea',
}

/** K. Atangana writes as the demo Analyst; the others have accounts of their own. */
// prettier-ignore
export const ANALYST_FIXTURES: StoredAnalyst[] = [
  { id: 'analyst-atangana', userId: 'user-analyst', displayName: 'K. Atangana', headline: 'CEMAC equity & sovereign analyst', since: '2021-03-01', followers: 412 },
  { id: 'analyst-ndong', userId: 'user-ndong', displayName: 'M. Ndong', headline: 'Oil, public finances and Gabon', since: '2022-01-10', followers: 268 },
  { id: 'analyst-fotso', userId: 'user-fotso', displayName: 'L. Fotso', headline: 'Agribusiness and consumer equities', since: '2022-06-01', followers: 193 },
  { id: 'analyst-essomba', userId: 'user-cessomba', displayName: 'C. Essomba', headline: 'Banks and insurers of Central Africa', since: '2023-02-15', followers: 121 },
  { id: 'analyst-ondo', userId: 'user-ondo', displayName: 'R. Ondo', headline: 'Sovereign debt and BEAC auctions', since: '2023-09-01', followers: 87 },
  // Approved in October; the first publication waits for the moderators (screen 9 mockup).
  { id: 'analyst-nguema', userId: 'user-nguema', displayName: 'C. Nguema', headline: 'Chad and the CEMAC budgets', since: '2026-10-19', followers: 0 },
]

export const ATANGANA = 'analyst-atangana'

const text = (value: string): RichTextNode => ({ type: 'text', text: value })
const paragraph = (value: string): RichTextNode => ({ type: 'paragraph', content: [text(value)] })
const heading = (value: string, level = 2): RichTextNode => ({
  type: 'heading',
  attrs: { level },
  content: [text(value)],
})
const bullets = (items: readonly string[]): RichTextNode => ({
  type: 'bulletList',
  content: items.map((item) => ({ type: 'listItem', content: [paragraph(item)] })),
})
const cell = (value: string, header = false): RichTextNode => ({
  type: header ? 'tableHeader' : 'tableCell',
  content: [paragraph(value)],
})
const table = (rows: readonly string[][]): RichTextNode => ({
  type: 'table',
  content: rows.map((row, index) => ({
    type: 'tableRow',
    content: row.map((value) => cell(value, index === 0)),
  })),
})
const chartNode = (chartId: string): RichTextNode => ({ type: CHART_NODE, attrs: { chartId } })
const doc = (...content: RichTextNode[]): RichTextDoc => ({ type: 'doc', content })

const grouped = (value: number) => value.toLocaleString('en-US')
const RATING_WORDS: Record<PublicationRating, string> = {
  buy: 'Buy',
  hold: 'Hold',
  sell: 'Sell',
  positive: 'positive',
  stable: 'stable',
  negative: 'negative',
}

const ALL_TICKED = { conflicts: true, disclaimer: true, sources: true }
const FREE: PublicationPricingDto = {
  access: 'free',
  price: null,
  studentPrice: null,
  freeAfterMonths: null,
}
const paid = (
  price: number,
  studentPrice: number | null = null,
  freeAfterMonths: number | null = null,
): PublicationPricingDto => ({ access: 'paid', price, studentPrice, freeAfterMonths })

/** What a sector's notes say first. */
const SECTOR_POINTS: Record<string, string> = {
  Banking:
    'Net interest income keeps rising with loans to the State and to large companies, while the cost of risk stays contained.',
  Insurance:
    'Premiums grow with oil and mining activity, and the claims ratio stays below the regional average.',
  Beverages: 'Volumes grow faster than prices in a mineral water market that the company leads.',
  Agribusiness:
    'Revenue follows palm oil and rubber prices, and yields improve as the replanting programme matures.',
}
const SECTOR_RISKS: Record<string, string> = {
  Banking: 'Arrears of the State: payments to suppliers slow down when oil revenue falls.',
  Insurance: 'Large claims: one industrial loss can take a year of profit.',
  Beverages: 'Packaging: PET resin prices follow oil with a lag of about six months.',
  Agribusiness: 'Prices: palm oil and rubber are priced in dollars on world markets.',
}
const COUNTRY_SITUATION: Record<string, string> = {
  CM: 'Growth holds around 4% on gas, agriculture and services, and inflation is easing.',
  GA: 'Oil still brings most of the public revenue, at a time when output is falling.',
  CG: 'The debt restructured with oil traders weighs on the budget until 2027.',
  TD: 'Oil revenue and the cost of security set the budget, with little room left.',
  CF: 'Budget support from partners covers most investment spending.',
  GQ: 'Gas projects take over from oil fields in decline, with a long gap in between.',
}

function companyBody(
  name: string,
  sector: string,
  rating: Recommendation,
  target: number,
  reference: number,
): RichTextDoc {
  const upside = ((target / reference - 1) * 100).toFixed(1)
  return doc(
    heading('1. Key points'),
    paragraph(`${name}: ${SECTOR_POINTS[sector] ?? SECTOR_POINTS.Banking}`),
    heading('2. Valuation and rating'),
    paragraph(
      `We set a target price of XAF ${grouped(target)}, ${Number(upside) >= 0 ? '+' : ''}${upside}% from the reference price of XAF ${grouped(reference)}, and rate the share ${RATING_WORDS[rating]}.`,
    ),
    heading('3. Risks'),
    bullets([
      'Liquidity: few shares change hands at each BVMAC session.',
      SECTOR_RISKS[sector] ?? SECTOR_RISKS.Banking,
      'Dividend: the payout is voted by the general meeting each year.',
    ]),
  )
}

function countryBody(country: string, outlook: Outlook): RichTextDoc {
  const name = COUNTRY_NAMES[country]
  return doc(
    heading('1. Situation'),
    paragraph(`${name}: ${COUNTRY_SITUATION[country]}`),
    heading('2. Public finances'),
    paragraph(
      'Debt service takes a growing share of revenue; the State relies on BEAC auctions for its cash needs and on the regional market for longer maturities.',
    ),
    heading('3. Outlook'),
    paragraph(`We see the outlook as ${outlook}.`),
  )
}

interface NoteInput {
  id: string
  analystId: string
  subjectType: SubjectType
  subjectId: string
  title: string
  summary: string
  /** First publication, Douala morning. */
  day: string
  pricing: PublicationPricingDto
  rating: PublicationRating
  targetPrice?: number | null
  horizonMonths?: number | null
  referencePrice?: number
  body?: RichTextDoc
  pages?: number
  status?: PublicationStatus
  charts?: FrozenChartDto[]
  monthly?: Record<string, MonthStats>
}

const publishedAt = (day: string) => `${day}T07:30:00Z`

function note(market: ResearchMarket, input: NoteInput): StoredPublication {
  const security = input.subjectType === 'company' ? market.security(input.subjectId) : undefined
  const referencePrice =
    input.referencePrice ??
    (security ? Math.round(market.closeOn(input.subjectId, input.day) ?? 0) : null)
  const content: StoredContent = {
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    title: input.title,
    summary: input.summary,
    body:
      input.body ??
      (security && referencePrice
        ? companyBody(
            security.name,
            security.sector,
            input.rating as Recommendation,
            input.targetPrice ?? referencePrice,
            referencePrice,
          )
        : countryBody(input.subjectId, input.rating as Outlook)),
    rating: input.rating,
    targetPrice: input.subjectType === 'company' ? (input.targetPrice ?? null) : null,
    horizonMonths: input.subjectType === 'company' ? (input.horizonMonths ?? 12) : null,
    referenceDate: security ? input.day : null,
    referencePrice,
    dataDate: security ? null : addDays(input.day, -3),
    disclosures: { ...ALL_TICKED },
  }
  const status = input.status ?? 'published'
  const at = publishedAt(input.day)
  return {
    id: input.id,
    analystId: input.analystId,
    status,
    createdAt: `${addDays(input.day, -6)}T09:00:00Z`,
    savedAt: at,
    version: 1,
    draft: content,
    pricing: input.pricing,
    attachment: null,
    charts: input.charts ?? [],
    versions:
      status === 'published' || status === 'archived'
        ? [
            {
              number: 1,
              publishedAt: at,
              content,
              pages: input.pages ?? estimatePages(content.summary, content.body),
            },
          ]
        : [],
    archiveReason: null,
    readFree: input.pricing.access === 'free',
    monthly: input.monthly ?? {},
  }
}

const stats = (reads: number, sales = 0, revenue = 0, starCount = 0, starSum = 0): MonthStats => ({
  reads,
  sales,
  revenue,
  starSum,
  starCount,
})

const OCTOBER = '2026-10'

/** The SEMC note of both mockups, with a 1-year price chart frozen on 28/10/2026. */
function semcNote(market: ResearchMarket): StoredPublication {
  const frozenAt = '2026-10-28'
  const chart: FrozenChartDto = {
    id: 'chart-semc-1y',
    securityId: 'SEMC',
    code: 'SEMC',
    title: 'SEMC · 1Y price',
    period: '1Y',
    type: 'line',
    currency: 'XAF',
    frozenAt,
    bars: market.bars('SEMC', addMonths(frozenAt, -12), frozenAt, '1d'),
  }
  const sections = (extra: RichTextNode[]) =>
    doc(
      heading('1. Growth driven by volumes'),
      paragraph(
        "In fiscal 2025, revenue grew on the back of volumes rather than prices. The company held its margins despite higher packaging costs, which confirms the strength of its position in Cameroon's mineral water market.",
      ),
      ...extra,
      chartNode(chart.id),
      heading('2. Valuation and rating'),
      paragraph(
        'Based on a target P/E of 12.7x, we derive a target price of XAF 58,000, i.e. 10.5% upside from the reference price of XAF 52,500.',
      ),
      heading('3. Risks: packaging costs, competition'),
      bullets([
        'Packaging: PET resin prices follow oil with a lag of about six months.',
        'Competition: two new mineral water brands entered the Douala market in 2026.',
        'Liquidity: about a hundred shares change hands a session, so a position takes time to build.',
      ]),
      heading('4. Appendix: financial statements 2021-2025'),
      table([
        ['XAF M', '2021', '2022', '2023', '2024', '2025'],
        ['Revenue', '21,400', '22,900', '24,600', '26,300', '28,500'],
        ['EBITDA', '4,060', '4,350', '4,780', '5,120', '5,640'],
        ['Net income', '1,980', '2,150', '2,370', '2,610', '2,890'],
        ['Dividend per share (XAF)', '2,350', '2,500', '2,700', '2,900', '3,150'],
      ]),
    )
  const publication = note(market, {
    id: 'pub-semc-volumes',
    analystId: ATANGANA,
    subjectType: 'company',
    subjectId: 'SEMC',
    title: 'SEMC: volume growth supports the dividend',
    summary:
      'Volumes sold are growing for the third year in a row. We raise our target price to XAF 58,000 and keep our Buy rating, supported by a yield close to 6%.',
    day: frozenAt,
    pricing: paid(15_000, 5000, 3),
    rating: 'buy',
    targetPrice: 58_000,
    horizonMonths: 12,
    referencePrice: 52_500,
    body: sections([]),
    pages: 14,
    charts: [chart],
    monthly: { [OCTOBER]: stats(410, 16, 220_000, 12, 55) },
  })
  // The update of the screen 7 mockup: third-quarter volumes added, the sources to tick again.
  publication.draft = {
    ...publication.draft,
    body: sections([
      paragraph(
        'Third-quarter volumes, published on 29/10, rose 7% from a year earlier, in line with our forecast.',
      ),
    ]),
    disclosures: { conflicts: true, disclaimer: true, sources: false },
  }
  publication.savedAt = '2026-10-30T09:41:00Z'
  publication.version = 7
  publication.attachment = {
    id: 'attachment-semc-note',
    fileName: 'semc_note_oct2026.pdf',
    contentType: 'application/pdf',
    size: 1_258_291,
    url: '',
  }
  return publication
}

/** The other notes of the two mockups, newest first after the SEMC note. */
function mockupNotes(market: ResearchMarket): StoredPublication[] {
  // prettier-ignore
  const notes: NoteInput[] = [
    { id: 'pub-cameroon-debt', analystId: ATANGANA, subjectType: 'country', subjectId: 'CM', title: 'Cameroon: debt trajectory 2026-2028', summary: 'Debt stops rising in 2026 and starts to fall in 2027 if the budget sticks to the IMF programme. We keep a stable outlook.', day: '2026-10-22', pricing: paid(25_000, 10_000), rating: 'stable', pages: 22, monthly: { [OCTOBER]: stats(655, 24, 600_000, 10, 44) } },
    { id: 'pub-bange-margins', analystId: ATANGANA, subjectType: 'company', subjectId: 'BANGE', title: 'BANGE: margins under pressure, attractive valuation', summary: 'Higher funding costs squeeze the margin, but the share trades at 0.8 times book value. We keep our Buy rating with a target of XAF 29,500.', day: '2026-10-18', pricing: FREE, rating: 'buy', targetPrice: 29_500, pages: 9, monthly: { [OCTOBER]: stats(1240, 0, 0, 8, 33) } },
    { id: 'pub-gabon-oil', analystId: 'analyst-ndong', subjectType: 'country', subjectId: 'GA', title: 'Gabon: oil supports revenue, debt remains high', summary: 'Oil prices keep the budget afloat in 2026, but debt service takes a third of revenue. Negative outlook.', day: '2026-10-15', pricing: paid(20_000), rating: 'negative', pages: 16, monthly: { [OCTOBER]: stats(380, 9, 180_000, 15, 70) } },
    { id: 'pub-scgre-growth', analystId: 'analyst-fotso', subjectType: 'company', subjectId: 'SCG-RE', title: 'SCG-RE: reinsurance growth is slowing', summary: 'Premiums grow less quickly as the oil groups renegotiate their cover. Hold, target XAF 22,500.', day: '2026-10-14', pricing: FREE, rating: 'hold', targetPrice: 22_500, pages: 6, monthly: { [OCTOBER]: stats(940, 0, 0, 14, 55) } },
    { id: 'pub-safacam-rubber', analystId: 'analyst-fotso', subjectType: 'company', subjectId: 'SAFACAM', title: 'SAFACAM: rubber prices and 2027 outlook', summary: 'Rubber prices are down 12% this year and the 2027 harvest will not make up for it. We move to Sell with a target of XAF 34,000.', day: '2026-10-11', pricing: paid(10_000, 4000), rating: 'sell', targetPrice: 34_000, pages: 11, monthly: { [OCTOBER]: stats(260, 7, 70_000, 10, 42) } },
    { id: 'pub-regionale-debt', analystId: 'analyst-ndong', subjectType: 'company', subjectId: 'REGIONALE', title: "REGIONALE: how exposed to Cameroon's debt?", summary: "Government securities make up a quarter of the bank's assets: a risk, but one paid 6.5% a year. Buy, target XAF 19,500.", day: '2026-10-09', pricing: paid(12_000), rating: 'buy', targetPrice: 19_500, pages: 8, monthly: { [OCTOBER]: stats(210, 5, 60_000, 8, 36) } },
    { id: 'pub-congo-outlook', analystId: ATANGANA, subjectType: 'country', subjectId: 'CG', title: 'Congo: outlook revised to stable', summary: 'Arrears are being cleared and the restructured oil debt is paid on time. We revise the outlook from negative to stable.', day: '2026-10-04', pricing: FREE, rating: 'stable', pages: 5, monthly: { [OCTOBER]: stats(862, 0, 0, 5, 20) } },
    // Studio only: in moderation, and withdrawn.
    { id: 'pub-gabon-auctions', analystId: ATANGANA, subjectType: 'country', subjectId: 'GA', title: 'Gabon: oil price impact on auctions', summary: 'Lower oil prices mean more BEAC auctions for Gabon in 2027, at higher rates.', day: '2026-10-16', pricing: paid(20_000), rating: 'negative', status: 'pending' },
    { id: 'pub-socapalm-half-year', analystId: ATANGANA, subjectType: 'company', subjectId: 'SOCAPALM', title: 'SOCAPALM: update on half-year results', summary: 'Half-year results in line with our forecast; palm oil prices hold up.', day: '2026-08-24', pricing: FREE, rating: 'hold', status: 'archived' },
    // Screen 9: a first publication, reviewed before it goes live.
    { id: 'pub-chad-budget', analystId: 'analyst-nguema', subjectType: 'country', subjectId: 'TD', title: 'Chad: 2027 budget and financing needs', summary: 'The 2027 budget counts on oil revenue holding up and on XAF 380 billion raised on the regional market, twice the 2026 amount. Stable outlook.', day: '2026-10-29', pricing: FREE, rating: 'stable', status: 'pending' },
  ]
  return notes.map((input) => {
    const publication = note(market, input)
    if (input.status === 'archived') {
      publication.archiveReason = 'Replaced by the full-year note.'
      publication.savedAt = '2026-10-12T08:00:00Z'
    }
    if (input.status === 'pending') publication.savedAt = `${input.day}T15:20:00Z`
    return publication
  })
}

/** Who covers what, and how many older notes each analyst published. */
// prettier-ignore
const COVERAGE: { analystId: string; count: number; from: string; companies: string[]; countries: string[] }[] = [
  { analystId: ATANGANA, count: 38, from: '2023-03-06', companies: ['SEMC', 'BANGE', 'SAFACAM', 'SOCAPALM', 'REGIONALE', 'SIAT', 'SCG-RE'], countries: ['CM', 'GA', 'CG', 'GQ'] },
  { analystId: 'analyst-ndong', count: 24, from: '2023-05-02', companies: ['SIAT', 'SCG-RE', 'BANGE'], countries: ['GA', 'CG', 'TD', 'GQ'] },
  { analystId: 'analyst-fotso', count: 22, from: '2023-06-12', companies: ['SAFACAM', 'SOCAPALM', 'SIAT', 'SEMC', 'SCG-RE'], countries: ['CM'] },
  { analystId: 'analyst-essomba', count: 20, from: '2023-10-02', companies: ['BANGE', 'REGIONALE', 'SCG-RE'], countries: ['CM', 'GQ', 'CF'] },
  { analystId: 'analyst-ondo', count: 16, from: '2024-01-15', companies: [], countries: ['CM', 'GA', 'CG', 'TD', 'CF', 'GQ'] },
]

/** Older notes end before the mockups' first one. */
const OLDER_UNTIL = '2026-10-02'
/** K. Atangana's ratings 12 months old or more: 17 of the 25 confirmed, the 68% of screen 8. */
const ATANGANA_MATURED_COMPANY_NOTES = 25
const ATANGANA_MISSED = new Set([2, 5, 8, 11, 14, 17, 20, 23])

const quarterOf = (day: string) =>
  `Q${Math.floor((Number(day.slice(5, 7)) - 1) / 3) + 1} ${day.slice(0, 4)}`

function companyTitle(code: string, day: string, index: number): string {
  const month = Number(day.slice(5, 7))
  const year = Number(day.slice(0, 4))
  if (month >= 3 && month <= 5) return `${code}: ${year - 1} annual results`
  if (month >= 8 && month <= 10) return `${code}: half-year results ${year}`
  if (month === 6 || month === 7) return `${code}: the ${year} dividend`
  return index % 2 === 0
    ? `${code}: ${quarterOf(day)} update`
    : `${code}: what to expect in ${quarterOf(day)}`
}

function countryTitle(country: string, day: string, index: number): string {
  const name = COUNTRY_NAMES[country]
  const year = Number(day.slice(0, 4))
  const titles = [
    `${name}: the ${Number(day.slice(5, 7)) >= 10 ? year + 1 : year} budget`,
    `${name}: public debt at the end of ${quarterOf(addMonths(day, -3))}`,
    `${name}: BEAC auctions in ${quarterOf(day)}`,
    `${name}: what the IMF review says`,
  ]
  return titles[index % titles.length]
}

const PRICES = [5000, 8000, 10_000, 12_000, 15_000, 20_000, 25_000]

/** A tick of the XAF equity market: hundreds of francs. */
const roundTarget = (value: number) => Math.round(value / 100) * 100

/** The older notes of one analyst, a few weeks apart, with their readers by month. */
function olderNotes(
  market: ResearchMarket,
  coverage: (typeof COVERAGE)[number],
): StoredPublication[] {
  const random = createRandom(hashString(`research|${coverage.analystId}`))
  const span = (Date.parse(OLDER_UNTIL) - Date.parse(coverage.from)) / 86_400_000
  const isAtangana = coverage.analystId === ATANGANA
  const maturedBefore = addMonths(market.today, -12)
  let maturedCompanies = 0
  let companyIndex = 0
  let countryIndex = 0

  return Array.from({ length: coverage.count }, (_, index) => {
    const day = addDays(coverage.from, Math.round((span * index) / (coverage.count - 1)))
    const matured = day <= maturedBefore
    // K. Atangana: the first 25 matured notes are on companies, so 25 ratings are scored.
    const onCompany = isAtangana
      ? matured
        ? maturedCompanies < ATANGANA_MATURED_COMPANY_NOTES
        : index % 5 < 2
      : coverage.companies.length > 0 && (coverage.countries.length === 0 || random() < 0.6)
    const subjectType: SubjectType = onCompany ? 'company' : 'country'
    const id = `pub-${coverage.analystId.slice(8)}-${String(index + 1).padStart(2, '0')}`

    let rating: PublicationRating
    let targetPrice: number | null = null
    let subjectId: string
    let title: string
    if (onCompany) {
      subjectId = coverage.companies[companyIndex % coverage.companies.length]
      title = companyTitle(market.security(subjectId)?.code ?? subjectId, day, companyIndex)
      companyIndex++
      const reference = market.closeOn(subjectId, day) ?? 10_000
      const later = market.closeOn(subjectId, addMonths(day, 12))
      const changePct = later ? (later / reference - 1) * 100 : 0
      if (isAtangana && matured) {
        // A rating the price later confirmed, or one it did not.
        const missed = ATANGANA_MISSED.has(maturedCompanies)
        maturedCompanies++
        rating = missed
          ? changePct > 0
            ? 'sell'
            : 'buy'
          : changePct > HOLD_BAND_PCT
            ? 'buy'
            : changePct < -HOLD_BAND_PCT
              ? 'sell'
              : 'hold'
      } else {
        const draw = random()
        rating = draw < 0.5 ? 'buy' : draw < 0.8 ? 'hold' : 'sell'
      }
      const factor = {
        buy: 1.1 + random() * 0.15,
        hold: 0.97 + random() * 0.06,
        sell: 0.8 + random() * 0.1,
      }
      targetPrice = roundTarget(reference * factor[rating as Recommendation])
    } else {
      subjectId = coverage.countries[countryIndex % coverage.countries.length]
      title = countryTitle(subjectId, day, countryIndex)
      countryIndex++
      const draw = random()
      rating = draw < 0.3 ? 'positive' : draw < 0.75 ? 'stable' : 'negative'
    }

    const draw = random()
    const price = PRICES[Math.floor(random() * PRICES.length)]
    const pricing =
      draw < 0.4
        ? FREE
        : paid(
            price,
            random() < 0.3 ? Math.max(2000, roundTarget(price / 3)) : null,
            random() < 0.4 ? 6 : null,
          )

    // Readers in the months after publication; K. Atangana's October is set by the mockup.
    const monthly: Record<string, MonthStats> = {}
    const audience = 40 + random() * 160
    for (let month = 0; month < 6; month++) {
      const key = monthOf(addMonths(day, month))
      if (key > monthOf(market.today) || (isAtangana && key >= OCTOBER)) break
      const reads = Math.round((audience * (1 + random())) / (month + 1))
      const sales = pricing.access === 'paid' ? Math.round(reads * (0.04 + random() * 0.06)) : 0
      const starCount = Math.round(reads * 0.03 * random())
      monthly[key] = stats(
        reads,
        sales,
        sales * (pricing.price ?? 0),
        starCount,
        Math.round(starCount * (3.8 + random() * 1.1)),
      )
    }
    return note(market, {
      id,
      analystId: coverage.analystId,
      subjectType,
      subjectId,
      title,
      summary:
        subjectType === 'company'
          ? `${title.split(':')[0]}: ${RATING_WORDS[rating]} rating${targetPrice ? `, target XAF ${grouped(targetPrice)}` : ''}.`
          : `${COUNTRY_NAMES[subjectId]}: ${RATING_WORDS[rating]} outlook.`,
      day,
      pricing,
      rating,
      targetPrice,
      horizonMonths: subjectType === 'company' ? 12 : null,
      pages: 4 + Math.floor(random() * 15),
      monthly,
    })
  })
}

/**
 * Ratings of K. Atangana's notes before October, nudged so that his average is the 4.4 of
 * screen 8; the notes of the mockups keep theirs.
 */
function settleAverage(publications: StoredPublication[], target: number): void {
  const all = publications.flatMap((publication) => Object.values(publication.monthly))
  const count = all.reduce((total, month) => total + month.starCount, 0)
  let gap = Math.round(target * count) - all.reduce((total, month) => total + month.starSum, 0)
  const adjustable = publications
    .filter((publication) => publication.id.startsWith('pub-atangana-'))
    .flatMap((publication) =>
      Object.entries(publication.monthly).flatMap(([key, month]) => (key < OCTOBER ? [month] : [])),
    )
  for (const month of adjustable) {
    if (gap === 0) break
    const room = gap > 0 ? 5 * month.starCount - month.starSum : month.starCount - month.starSum
    const step = gap > 0 ? Math.min(gap, room) : Math.max(gap, room)
    month.starSum += step
    gap -= step
  }
}

/** The research library of screens 7 and 8: 128 publications, 44 of them by K. Atangana. */
export function createLibrary(market: ResearchMarket): StoredPublication[] {
  const older = COVERAGE.flatMap((coverage) => olderNotes(market, coverage))
  // Two of K. Atangana's notes still sell in October: 58 sales and XAF 1,120,000 in all.
  const [lastPaid, beforeLast] = older
    .filter((publication) => publication.analystId === ATANGANA)
    .slice(-2)
    .reverse()
  lastPaid.pricing = paid(20_000)
  lastPaid.readFree = false
  lastPaid.monthly[OCTOBER] = stats(150, 12, 240_000, 2, 10)
  beforeLast.pricing = paid(10_000)
  beforeLast.readFree = false
  beforeLast.monthly[OCTOBER] = stats(95, 6, 60_000)

  const library = [semcNote(market), ...mockupNotes(market), ...older]
  settleAverage(
    library.filter(
      (publication) => publication.analystId === ATANGANA && publication.status === 'published',
    ),
    4.4,
  )
  return library
}

/** The demo users have read two free notes of screen 8, bought one and follow M. Ndong. */
export const READ_FIXTURES = ['pub-bange-margins', 'pub-scgre-growth']
export const FOLLOW_FIXTURES = ['analyst-ndong']
