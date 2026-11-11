import { Copy, Plus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCreateIngestClient } from '@/entities/news-source'
import { isApiError } from '@/shared/api'
import type { IngestClientCreatedDto } from '@/shared/api/contracts'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { NumberInput } from '@/shared/ui/form/NumberInput'
import { Textarea } from '@/shared/ui/form/Textarea'
import { TextInput } from '@/shared/ui/form/TextInput'
import { toast } from '@/shared/ui/toast'
import { addressLines, isAddressOrRange, MAX_ADDRESSES } from '../lib/addresses'

const MAX_QUOTA = 100_000

/**
 * "+ Client" of SRC (spec section 10, /admin/ingest-clients): a server of CMarket AI allowed to push
 * news, its name, its addresses and its items an hour; created, its key and its signing secret show
 * once, the secret never again.
 */
export function NewIngestClient() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [created, setCreated] = useState<IngestClientCreatedDto | null>(null)
  const close = () => {
    setOpen(false)
    setCreated(null)
  }
  return (
    <>
      <Button
        size="sm"
        variant="link"
        icon={Plus}
        onClick={() => setOpen(true)}
        className="panel-no-drag"
      >
        {t('ingestClients.new')}
      </Button>
      <Dialog
        open={open}
        onClose={close}
        title={
          created
            ? t('ingestClients.createdTitle', { name: created.client.name })
            : t('ingestClients.newTitle')
        }
      >
        {created ? (
          <Secret created={created} onClose={close} />
        ) : (
          <ClientForm onCreated={setCreated} onClose={close} />
        )}
      </Dialog>
    </>
  )
}

function ClientForm({
  onCreated,
  onClose,
}: {
  onCreated: (created: IngestClientCreatedDto) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const create = useCreateIngestClient()
  const [name, setName] = useState('')
  const [addresses, setAddresses] = useState('')
  const [quota, setQuota] = useState<number | null>(1_000)
  const [submitted, setSubmitted] = useState(false)
  const lines = addressLines(addresses)
  const wrong = lines.find((line) => !isAddressOrRange(line))
  const local = {
    name:
      name.trim().length > 0 && name.trim().length <= 100 ? null : t('ingestClients.errors.name'),
    addresses: wrong
      ? t('ingestClients.errors.address', { address: wrong })
      : lines.length > 0 && lines.length <= MAX_ADDRESSES
        ? null
        : t('ingestClients.errors.addresses'),
    hourlyQuota:
      quota !== null && Number.isInteger(quota) && quota >= 1 && quota <= MAX_QUOTA
        ? null
        : t('ingestClients.errors.quota'),
  }
  const server = isApiError(create.error, 400) ? (create.error.problem.errors ?? {}) : {}
  const serverAddress = Object.entries(server).find(([key]) =>
    key.startsWith('addresses'),
  )?.[1]?.[0]
  const error = (field: keyof typeof local) =>
    (submitted && local[field]) || (field === 'addresses' ? serverAddress : server[field]?.[0])

  return (
    <form
      noValidate
      className="contents"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (Object.values(local).some(Boolean)) return
        create.mutate(
          { name: name.trim(), addresses: lines, hourlyQuota: quota },
          { onSuccess: onCreated },
        )
      }}
    >
      <DialogBody>
        <p className="font-sans text-label text-secondary">{t('ingestClients.hint')}</p>
        <Field label={t('ingestClients.name')} error={error('name')}>
          <TextInput value={name} onChange={setName} placeholder="CMarket AI" highlight />
        </Field>
        <Field
          label={t('ingestClients.addresses')}
          hint={t('ingestClients.addressesHint')}
          error={error('addresses')}
        >
          <Textarea value={addresses} onChange={setAddresses} rows={4} highlight />
        </Field>
        <Field
          label={t('ingestClients.quota')}
          hint={t('ingestClients.quotaHint')}
          error={error('hourlyQuota')}
        >
          <NumberInput value={quota} onChange={setQuota} decimals={0} highlight className="w-32" />
        </Field>
        {create.error && !isApiError(create.error, 400) && (
          <p role="alert" className="font-sans text-label text-down">
            {create.error.message}
          </p>
        )}
      </DialogBody>
      <DialogFooter>
        <Button onClick={onClose}>{t('ingestClients.cancel')}</Button>
        <Button type="submit" variant="primary" busy={create.isPending}>
          {t('ingestClients.create')}
        </Button>
      </DialogFooter>
    </form>
  )
}

/** The key and the secret, shown this once; Copy puts each on the clipboard. */
function Secret({ created, onClose }: { created: IngestClientCreatedDto; onClose: () => void }) {
  const { t } = useTranslation()
  const copy = (text: string) =>
    void navigator.clipboard.writeText(text).then(
      () => toast.success(t('ingestClients.copied')),
      () => undefined,
    )
  return (
    <>
      <DialogBody>
        <p className="font-sans text-label text-secondary">{t('ingestClients.secretIntro')}</p>
        {[
          { label: t('ingestClients.key'), value: created.client.keyId },
          { label: t('ingestClients.secret'), value: created.secret },
        ].map(({ label, value }) => (
          <Field key={label} label={label}>
            <TextInput
              value={value}
              onChange={() => undefined}
              readOnly
              mono
              trailing={
                <button
                  type="button"
                  onClick={() => copy(value)}
                  aria-label={`${t('ingestClients.copy')} · ${label}`}
                  className="inline-flex size-6 items-center justify-center text-secondary hover:text-primary"
                >
                  <Copy aria-hidden className="size-3.5" />
                </button>
              }
            />
          </Field>
        ))}
      </DialogBody>
      <DialogFooter>
        <Button variant="primary" onClick={onClose}>
          {t('ingestClients.done')}
        </Button>
      </DialogFooter>
    </>
  )
}
