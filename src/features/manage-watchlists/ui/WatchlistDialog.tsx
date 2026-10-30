import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DEFAULT_WATCHLIST_COLUMNS,
  useCreateWatchlist,
  useUpdateWatchlist,
  WATCHLIST_COLUMNS,
  type WatchlistDialogRequest,
} from '@/entities/watchlist'
import type { WatchlistColumn, WatchlistDto } from '@/shared/api/contracts'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Checkbox } from '@/shared/ui/form/Checkbox'
import { Field } from '@/shared/ui/form/Field'
import { TextInput } from '@/shared/ui/form/TextInput'
import { toast } from '@/shared/ui/toast'

const MAX_NAME_LENGTH = 40

interface WatchlistDialogProps {
  request: WatchlistDialogRequest | null
  onClose: () => void
  /** The list as the server saved it. */
  onSaved?: (list: WatchlistDto) => void
}

/** Creates a list or changes its name and columns (spec section 2: configurable columns). */
export function WatchlistDialog({ request, onClose, onSaved }: WatchlistDialogProps) {
  const { t } = useTranslation()
  const title =
    request?.mode === 'edit'
      ? t('watchlists.editTitle', { code: request.watchlist.code })
      : t('watchlists.newTitle')
  return (
    <Dialog open={request !== null} onClose={onClose} title={title} width={420}>
      {request && <WatchlistForm request={request} onClose={onClose} onSaved={onSaved} />}
    </Dialog>
  )
}

function WatchlistForm({
  request,
  onClose,
  onSaved,
}: Omit<WatchlistDialogProps, 'request'> & { request: WatchlistDialogRequest }) {
  const { t } = useTranslation()
  const editing = request.mode === 'edit' ? request.watchlist : null
  const securities = request.mode === 'create' ? (request.securities ?? []) : []
  const [name, setName] = useState(editing?.name ?? '')
  const [columns, setColumns] = useState<readonly WatchlistColumn[]>(
    editing?.columns ?? DEFAULT_WATCHLIST_COLUMNS,
  )
  const [submitted, setSubmitted] = useState(false)
  const create = useCreateWatchlist()
  const update = useUpdateWatchlist()
  const mutation = editing ? update : create
  const nameError = submitted && name.trim() === '' ? t('watchlists.nameRequired') : undefined

  const submit = () => {
    setSubmitted(true)
    if (name.trim() === '') return
    const input = {
      name: name.trim(),
      columns: WATCHLIST_COLUMNS.filter((column) => columns.includes(column)),
    }
    const onSuccess = (list: WatchlistDto) => {
      toast.success(
        t(editing ? 'watchlists.saved' : 'watchlists.created', {
          list: `${list.code} · ${list.name}`,
        }),
      )
      onSaved?.(list)
      onClose()
    }
    if (editing) update.mutate({ id: editing.id, ...input }, { onSuccess })
    else
      create.mutate(
        { ...input, securityIds: securities.map((security) => security.id) },
        { onSuccess },
      )
  }

  return (
    <form
      className="contents"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <DialogBody>
        <Field label={t('watchlists.name')} error={nameError}>
          <TextInput value={name} onChange={setName} maxLength={MAX_NAME_LENGTH} />
        </Field>
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1 font-sans text-data text-secondary">
            {t('watchlists.columns')}
          </legend>
          <span className="font-mono text-data text-secondary">
            {t('watchlists.codeAlwaysShown')}
          </span>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {WATCHLIST_COLUMNS.map((column) => (
              <Checkbox
                key={column}
                checked={columns.includes(column)}
                onChange={(checked) =>
                  setColumns((current) =>
                    checked ? [...current, column] : current.filter((value) => value !== column),
                  )
                }
                label={t(`watchlists.columnNames.${column}`)}
              />
            ))}
          </div>
        </fieldset>
        {securities.length > 0 && (
          <p className="font-sans text-data text-secondary">
            {t('watchlists.startsWith', {
              count: securities.length,
              codes: securities.map((security) => security.code).join(', '),
            })}
          </p>
        )}
        {mutation.error && (
          <p role="alert" className="font-sans text-data text-down">
            {mutation.error.message}
          </p>
        )}
      </DialogBody>
      <DialogFooter>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" variant="primary" busy={mutation.isPending}>
          {editing ? t('common.save') : t('watchlists.create')}
        </Button>
      </DialogFooter>
    </form>
  )
}
