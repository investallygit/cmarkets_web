import { Search } from 'lucide-react'
import { useState } from 'react'
import { DateInput } from '@/shared/ui/form/DateInput'
import { Field } from '@/shared/ui/form/Field'
import { NumberInput } from '@/shared/ui/form/NumberInput'
import { Select } from '@/shared/ui/form/Select'
import { Textarea } from '@/shared/ui/form/Textarea'
import { TextInput } from '@/shared/ui/form/TextInput'
import { Panel } from '@/shared/ui/Panel'

const MARKETS = [
  { value: 'bvmac-equities', label: 'BVMAC — Equities' },
  { value: 'bvmac-bonds', label: 'BVMAC — Bonds' },
  { value: 'us', label: 'United States' },
]

const PE_RANGES = [
  { value: 'all', label: 'All' },
  { value: '5-15', label: 'between 5x and 15x' },
  { value: 'under-10', label: '< 10x' },
]

const ACCOUNT_TYPES = [
  { value: 'all', label: 'All' },
  { value: 'student', label: 'Student' },
  { value: 'analyst', label: 'Analyst' },
]

/** Screener criteria (screen 3) on the left, bond calculator inputs (screen 4) on the right. */
export function FieldsSample() {
  const [market, setMarket] = useState('bvmac-equities')
  const [pe, setPe] = useState('5-15')
  const [accountType, setAccountType] = useState('all')
  const [search, setSearch] = useState('')
  const [summary, setSummary] = useState('Volumes sold are growing for the third year in a row.')
  const [settlement, setSettlement] = useState<string | null>('2026-10-30')
  const [cleanPrice, setCleanPrice] = useState<number | null>(101.4)
  const [face, setFace] = useState<number | null>(100_000_000)
  const [price, setPrice] = useState<number | null>(150_000)
  const [freeAfter, setFreeAfter] = useState<number | null>(3)
  const outOfRange = price !== null && (price < 2_000 || price > 100_000)

  return (
    <Panel title="Fields" code="KIT">
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-2">
        <div className="flex flex-col gap-3">
          <Field label="Market">
            <Select value={market} onChange={setMarket} options={MARKETS} />
          </Field>
          <Field label="P/E" hint="Amber border: an active criterion">
            <Select value={pe} onChange={setPe} options={PE_RANGES} highlight={pe !== 'all'} />
          </Field>
          <Select
            aria-label="Account type"
            prefix="Type:"
            value={accountType}
            onChange={setAccountType}
            options={ACCOUNT_TYPES}
          />
          <TextInput
            aria-label="Search"
            icon={Search}
            placeholder="Search name, e-mail, organisation"
            value={search}
            onChange={setSearch}
          />
          <Field label="Summary (always visible for free)">
            <Textarea value={summary} onChange={setSummary} />
          </Field>
        </div>
        <div className="flex flex-col gap-3">
          <Field inline label="Settlement date">
            <DateInput value={settlement} onChange={setSettlement} highlight />
          </Field>
          <Field inline label="Clean price">
            <NumberInput value={cleanPrice} onChange={setCleanPrice} highlight />
          </Field>
          <Field inline label="Face amount (XAF)">
            <NumberInput value={face} onChange={setFace} decimals={0} highlight />
          </Field>
          <Field
            label="Price (XAF)"
            hint="Range: XAF 2,000 to 100,000"
            error={outOfRange ? 'Outside the range set by the Admin' : undefined}
          >
            <NumberInput value={price} onChange={setPrice} decimals={0} highlight />
          </Field>
          <Field label="Automatically free after" hint="Optional">
            <NumberInput value={freeAfter} onChange={setFreeAfter} decimals={0} suffix="months" />
          </Field>
        </div>
      </div>
    </Panel>
  )
}
