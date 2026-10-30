import { ChartCandlestick, Plus } from 'lucide-react'
import { useState } from 'react'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { DateInput } from '@/shared/ui/form/DateInput'
import { Field } from '@/shared/ui/form/Field'
import { FileDrop } from '@/shared/ui/form/FileDrop'
import { NumberInput } from '@/shared/ui/form/NumberInput'
import { SegmentedControl } from '@/shared/ui/form/SegmentedControl'
import { Select } from '@/shared/ui/form/Select'
import { TextInput } from '@/shared/ui/form/TextInput'
import { Panel } from '@/shared/ui/Panel'
import { toast } from '@/shared/ui/toast'
import { SampleRow } from './SampleRow'

type OpenDialog = 'chart' | 'transaction' | 'suspend'

const SECURITIES = [
  { value: 'SEMC', label: 'SEMC — Société des Eaux Minérales du Cameroun' },
  { value: 'BANGE', label: 'BANGE — Banque Nationale de Guinée Équatoriale' },
  { value: 'SAFACAM', label: 'SAFACAM — Société Africaine Forestière et Agricole' },
]

const TRANSACTION_TYPES = [
  'Buy',
  'Sell',
  'Subscription',
  'Redemption',
  'Dividend',
  'Coupon',
  'Fees',
  'Cash deposit',
  'Cash withdrawal',
].map((label) => ({ value: label.toLowerCase(), label }))

export function OverlaysSample() {
  const [open, setOpen] = useState<OpenDialog | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const close = () => setOpen(null)

  return (
    <Panel title="Dialogs, toasts and files" code="KIT">
      <div className="flex flex-col gap-3 p-2">
        <SampleRow label="Dialogs">
          <Button variant="info" icon={ChartCandlestick} onClick={() => setOpen('chart')}>
            CMarket chart
          </Button>
          <Button variant="primary" icon={Plus} onClick={() => setOpen('transaction')}>
            New transaction
          </Button>
          <Button variant="danger" onClick={() => setOpen('suspend')}>
            Suspend account
          </Button>
        </SampleRow>
        <SampleRow label="Toasts">
          <Button onClick={() => toast.success('Draft saved at 10:41')}>Success</Button>
          <Button onClick={() => toast.info('2 new publications from followed analysts')}>
            Info
          </Button>
          <Button onClick={() => toast.error('Price outside the range set by the Admin')}>
            Error
          </Button>
        </SampleRow>
        <Field label="Daily prices file">
          <FileDrop file={file} onChange={setFile} accept=".csv,.xlsx" maxSize={10 * 1024 * 1024} />
        </Field>
      </div>

      <Dialog open={open === 'chart'} onClose={close} title="Insert a CMarket chart">
        <ChartForm onClose={close} />
      </Dialog>
      <Dialog
        open={open === 'transaction'}
        onClose={close}
        title="New transaction"
        placement="right"
      >
        <TransactionForm onClose={close} />
      </Dialog>
      <ConfirmDialog
        open={open === 'suspend'}
        onClose={close}
        title="Suspend account"
        message="K. Atangana is logged out and loses access until the account is reactivated."
        confirmLabel="Suspend"
        tone="danger"
        requireReason
        onConfirm={(reason) => {
          close()
          toast.success(`K. Atangana suspended: ${reason}`)
        }}
      />
    </Panel>
  )
}

/** Dialog of the publishing studio (screen 7): a chart frozen at the insertion date. */
function ChartForm({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('SEMC · 1Y price')
  const [security, setSecurity] = useState('SEMC')
  const [period, setPeriod] = useState<'1M' | '3M' | '6M' | '1Y' | '5Y'>('1Y')
  const [type, setType] = useState<'line' | 'candles'>('line')

  return (
    <form
      className="contents"
      onSubmit={(event) => {
        event.preventDefault()
        onClose()
        toast.success(`${title}: inserted, frozen at 28/10/2026`)
      }}
    >
      <DialogBody>
        <Field label="Title">
          <TextInput value={title} onChange={setTitle} required />
        </Field>
        <Field label="Security">
          <Select value={security} onChange={setSecurity} options={SECURITIES} />
        </Field>
        <Field label="Period" group>
          <SegmentedControl
            value={period}
            onChange={setPeriod}
            options={(['1M', '3M', '6M', '1Y', '5Y'] as const).map((value) => ({
              value,
              label: value,
            }))}
          />
        </Field>
        <Field label="Type" group>
          <SegmentedControl
            value={type}
            onChange={setType}
            options={[
              { value: 'line', label: 'Line' },
              { value: 'candles', label: 'Candles' },
            ]}
          />
        </Field>
      </DialogBody>
      <DialogFooter>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="primary">
          Insert
        </Button>
      </DialogFooter>
    </form>
  )
}

/** Side form of the portfolio screen (screen 5). */
function TransactionForm({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState('buy')
  const [date, setDate] = useState<string | null>('2026-10-28')
  const [security, setSecurity] = useState('SEMC')
  const [quantity, setQuantity] = useState<number | null>(100)
  const [price, setPrice] = useState<number | null>(52_500)
  const [fees, setFees] = useState<number | null>(500)
  const complete = date !== null && quantity !== null && price !== null

  return (
    <form
      className="contents"
      onSubmit={(event) => {
        event.preventDefault()
        onClose()
        toast.success(`${quantity} ${security} recorded`)
      }}
    >
      <DialogBody>
        <Field label="Type">
          <Select value={type} onChange={setType} options={TRANSACTION_TYPES} />
        </Field>
        <Field label="Trade date">
          <DateInput value={date} onChange={setDate} />
        </Field>
        <Field label="Security">
          <Select value={security} onChange={setSecurity} options={SECURITIES} />
        </Field>
        <Field label="Quantity">
          <NumberInput value={quantity} onChange={setQuantity} decimals={0} />
        </Field>
        <Field label="Price (XAF)">
          <NumberInput value={price} onChange={setPrice} decimals={0} />
        </Field>
        <Field label="Fees (XAF)">
          <NumberInput value={fees} onChange={setFees} decimals={0} />
        </Field>
      </DialogBody>
      <DialogFooter>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={!complete}>
          Record
        </Button>
      </DialogFooter>
    </form>
  )
}
