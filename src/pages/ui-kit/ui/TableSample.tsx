import { useFormat } from '@/shared/i18n'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'

interface SampleQuote {
  code: string
  name: string
  last: number
  changePct: number
  volume: number
}

const QUOTES: SampleQuote[] = [
  {
    code: 'SEMC',
    name: 'Société des Eaux Minérales du Cameroun',
    last: 52500,
    changePct: 1.15,
    volume: 96,
  },
  {
    code: 'BANGE',
    name: 'Banque Nationale de Guinée Équatoriale',
    last: 26750,
    changePct: 2.1,
    volume: 412,
  },
  {
    code: 'SOCAPALM',
    name: 'Société Camerounaise de Palmeraies',
    last: 41200,
    changePct: 0,
    volume: 218,
  },
  {
    code: 'SAFACAM',
    name: 'Société Africaine Forestière et Agricole',
    last: 38900,
    changePct: -0.51,
    volume: 74,
  },
  { code: 'REGIONALE', name: 'La Régionale', last: 17400, changePct: 0.58, volume: 1530 },
]

function Figure({ value, decimals = 0 }: { value: number; decimals?: number }) {
  return useFormat().number(value, decimals)
}

const helper = createDataColumnHelper<SampleQuote>()
const COLUMNS = helper.columns([
  helper.accessor('code', { header: 'Security', meta: { width: '96px' } }),
  helper.accessor('name', { header: 'Name' }),
  helper.accessor('last', {
    header: 'Last',
    meta: { align: 'right', width: '88px' },
    cell: ({ getValue }) => <Figure value={getValue()} />,
  }),
  helper.accessor('changePct', {
    header: '% chg.',
    meta: { align: 'right', width: '72px' },
    cell: ({ getValue }) => <Figure value={getValue()} decimals={2} />,
  }),
  helper.accessor('volume', {
    header: 'Volume',
    meta: { align: 'right', width: '72px' },
    cell: ({ getValue }) => <Figure value={getValue()} />,
  }),
])

/** Right-click a row: Excel and CSV export, hidden for a Student account. */
export function TableSample() {
  return (
    <div className="h-48">
      <Panel title="Table export (right-click a row)" code="KIT">
        <DataTable
          data={QUOTES}
          columns={COLUMNS}
          getRowId={(quote) => quote.code}
          exportName="cmarket-kit"
        />
      </Panel>
    </div>
  )
}
