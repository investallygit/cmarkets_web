import { Download, Plus } from 'lucide-react'
import { useState } from 'react'
import { ACCOUNT_TYPE_COLORS } from '@/shared/config/accountTypes'
import { Button } from '@/shared/ui/form/Button'
import { Checkbox } from '@/shared/ui/form/Checkbox'
import { Field } from '@/shared/ui/form/Field'
import { SegmentedControl } from '@/shared/ui/form/SegmentedControl'
import { Switch } from '@/shared/ui/form/Switch'
import { Panel } from '@/shared/ui/Panel'
import { SampleRow } from './SampleRow'

const DISCLOSURES = [
  'No SEMC shares held (declared)',
  'Disclaimer: not personal advice',
  'Sources and dates of data cited',
]

export function ButtonsSample() {
  const [busy, setBusy] = useState(false)
  return (
    <Panel title="Buttons" code="KIT">
      <div className="flex flex-col gap-3 p-2">
        <SampleRow label="Variants">
          <Button variant="primary">Run</Button>
          <Button>Reset</Button>
          <Button variant="info" icon={Download}>
            Download file templates
          </Button>
          <Button variant="success">Approve</Button>
          <Button variant="danger">Reject</Button>
          <Button variant="link">Open</Button>
        </SampleRow>
        <SampleRow label="Sizes">
          <Button size="sm">Change type</Button>
          <Button>Fix row</Button>
          <Button variant="primary" size="lg" icon={Plus}>
            New transaction
          </Button>
        </SampleRow>
        <SampleRow label="States">
          <Button variant="primary" disabled>
            Submit
          </Button>
          <Button
            variant="primary"
            busy={busy}
            onClick={() => {
              setBusy(true)
              window.setTimeout(() => setBusy(false), 1500)
            }}
          >
            Buy this report
          </Button>
        </SampleRow>
      </div>
    </Panel>
  )
}

export function ChoicesSample() {
  const [subject, setSubject] = useState<'company' | 'country'>('company')
  const [access, setAccess] = useState<'free' | 'paid'>('paid')
  const [rating, setRating] = useState<'buy' | 'hold' | 'sell' | null>('buy')
  const [ticked, setTicked] = useState([true, true, false])
  const [online, setOnline] = useState(true)
  const [types, setTypes] = useState({ analyst: true, trader: false })

  return (
    <Panel title="Choices" code="KIT">
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-2">
        <div className="flex flex-col gap-3">
          <Field label="Subject" group>
            <SegmentedControl
              value={subject}
              onChange={setSubject}
              options={[
                { value: 'company', label: 'Company' },
                { value: 'country', label: 'Country' },
              ]}
            />
          </Field>
          <Field label="Access" group>
            <SegmentedControl
              value={access}
              onChange={setAccess}
              options={[
                { value: 'free', label: 'Free' },
                { value: 'paid', label: 'Paid' },
              ]}
            />
          </Field>
          <Field label="Rating" group>
            <SegmentedControl
              value={rating}
              onChange={setRating}
              options={[
                { value: 'buy', label: 'Buy', tone: 'up' },
                { value: 'hold', label: 'Hold' },
                { value: 'sell', label: 'Sell', tone: 'down' },
              ]}
            />
          </Field>
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-sans text-title font-semibold tracking-title text-accent-amber uppercase">
            Mandatory disclosures
          </span>
          {DISCLOSURES.map((label, index) => (
            <Checkbox
              key={label}
              label={label}
              highlight
              checked={ticked[index]}
              onChange={(checked) =>
                setTicked((current) => current.map((value, at) => (at === index ? checked : value)))
              }
            />
          ))}
          <Button variant="primary" disabled={!ticked.every(Boolean)} className="mt-1">
            Submit
          </Button>
          <Switch label="Show my online status" checked={online} onChange={setOnline} />
          {/* A box in a colour of its own: the account types of the directory (screen 10). */}
          <Checkbox
            label="Analyst"
            color={ACCOUNT_TYPE_COLORS.analyst}
            checked={types.analyst}
            onChange={(analyst) => setTypes((current) => ({ ...current, analyst }))}
          />
          <Checkbox
            label="Trader"
            color={ACCOUNT_TYPE_COLORS.trader}
            checked={types.trader}
            onChange={(trader) => setTypes((current) => ({ ...current, trader }))}
          />
        </div>
      </div>
    </Panel>
  )
}
