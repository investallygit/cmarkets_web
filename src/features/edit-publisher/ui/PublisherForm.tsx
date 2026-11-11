import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRemovePublisher, useSavePublisher } from '@/entities/news-source'
import { isApiError } from '@/shared/api'
import type { PublisherDto } from '@/shared/api/contracts'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { TextInput } from '@/shared/ui/form/TextInput'
import { toast } from '@/shared/ui/toast'

const SHORT_NAME = /^[\p{Lu}\p{N}][\p{Lu}\p{N} .&'-]{0,15}$/u
const DOMAIN =
  /^(?:https?:\/\/)?(?:www\.)?(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9-]{2,}(?:[/?#].*)?$/i

interface PublisherFormProps {
  /** The row edited; null for a new domain. */
  publisher: PublisherDto | null
  onSaved: (publisher: PublisherDto) => void
  onRemoved: () => void
}

/**
 * A publisher's row (NEWS, spec section 16): the domain the feeds' links come from and the
 * newspaper it stands for, whose tag the international API's and the AI's stories show. Saved,
 * the newspapers of the domain take its names; removed, they keep the names they have.
 */
export function PublisherForm({ publisher, onSaved, onRemoved }: PublisherFormProps) {
  const { t } = useTranslation()
  const save = useSavePublisher()
  const remove = useRemovePublisher()
  const [domain, setDomain] = useState(publisher?.domain ?? '')
  const [name, setName] = useState(publisher?.name ?? '')
  const [shortName, setShortName] = useState(publisher?.shortName ?? '')
  const [submitted, setSubmitted] = useState(false)
  const [removing, setRemoving] = useState(false)

  const local = {
    domain: DOMAIN.test(domain.trim()) ? null : t('publishers.errors.domain'),
    name: name.trim().length > 0 && name.trim().length <= 100 ? null : t('publishers.errors.name'),
    shortName:
      shortName.trim() === '' || SHORT_NAME.test(shortName.trim())
        ? null
        : t('publishers.errors.shortName'),
  }
  const server = isApiError(save.error, 400) ? (save.error.problem.errors ?? {}) : {}
  const error = (field: keyof typeof local) => (submitted && local[field]) || server[field]?.[0]

  return (
    <form
      noValidate
      className="flex flex-col gap-3 p-3"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (Object.values(local).some(Boolean)) return
        save.mutate(
          { domain: domain.trim(), name: name.trim(), shortName: shortName.trim() || null },
          {
            onSuccess: (saved) => {
              toast.success(t('publishers.saved', { domain: saved.domain }))
              setSubmitted(false)
              onSaved(saved)
            },
          },
        )
      }}
    >
      <p className="font-sans text-data text-secondary">{t('publishers.hint')}</p>
      <Field
        label={t('publishers.domain')}
        hint={t('publishers.domainHint')}
        error={error('domain')}
      >
        <TextInput
          value={domain}
          onChange={setDomain}
          disabled={publisher !== null}
          placeholder="mediaexample.com"
          mono
          highlight={publisher === null}
        />
      </Field>
      <Field label={t('publishers.name')} error={error('name')}>
        <TextInput value={name} onChange={setName} highlight />
      </Field>
      <Field
        label={t('publishers.shortName')}
        hint={t('publishers.shortNameHint')}
        error={error('shortName')}
      >
        <TextInput
          value={shortName}
          onChange={(value) => setShortName(value.toUpperCase())}
          mono
          highlight
        />
      </Field>
      {save.error && !isApiError(save.error, 400) && (
        <p role="alert" className="font-sans text-data text-down">
          {save.error.message}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="primary" busy={save.isPending}>
          {t('publishers.save')}
        </Button>
        {publisher && (
          <Button variant="danger" onClick={() => setRemoving(true)}>
            {t('publishers.remove')}
          </Button>
        )}
      </div>
      {publisher && (
        <ConfirmDialog
          open={removing}
          onClose={() => {
            remove.reset()
            setRemoving(false)
          }}
          title={t('publishers.removeTitle', { domain: publisher.domain })}
          message={
            <>
              {t('publishers.removeMessage')}
              {remove.error && (
                <span role="alert" className="mt-2 block text-down">
                  {remove.error.message}
                </span>
              )}
            </>
          }
          confirmLabel={t('publishers.remove')}
          tone="danger"
          busy={remove.isPending}
          onConfirm={() =>
            remove.mutate(publisher.id, {
              onSuccess: () => {
                toast.success(t('publishers.removed', { domain: publisher.domain }))
                setRemoving(false)
                onRemoved()
              },
            })
          }
        />
      )}
    </form>
  )
}
