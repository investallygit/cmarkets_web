import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSvtSettings } from '@/entities/rfq'
import { useChangeLinkLimit, useConfirmLink } from '@/entities/svt-link'
import { isApiError } from '@/shared/api'
import type { TraderLinkDto } from '@/shared/api/contracts'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Checkbox } from '@/shared/ui/form/Checkbox'
import { Field } from '@/shared/ui/form/Field'
import { NumberInput } from '@/shared/ui/form/NumberInput'
import { toast } from '@/shared/ui/toast'

interface LimitDialogProps {
  /** confirm: a request confirmed with its limit; limit: a confirmed link's limit changed. */
  mode: 'confirm' | 'limit'
  link: TraderLinkDto | null
  onClose: () => void
}

/**
 * The client's daily limit, XAF, or none (screen 22: "The SVT confirms (setting a daily limit for
 * this client if needed)"; screen 27: "change the limit"): POST /svt/links/{id}/confirm or PUT
 * /svt/links/{id}/limit. A confirmation offers the bank's default client limit (ROADMAP step 45).
 */
export function LimitDialog({ mode, link, onClose }: LimitDialogProps) {
  const { t } = useTranslation()
  const settings = useSvtSettings(link !== null && mode === 'confirm')
  const name = link?.trader.name ?? ''
  // The form starts from the bank's default: it waits for it, or for its failure.
  const ready = mode !== 'confirm' || !settings.isPending
  return (
    <Dialog
      open={link !== null}
      onClose={onClose}
      title={
        mode === 'confirm'
          ? t('rfq.links.confirmDialog.title', { name })
          : t('rfq.links.limitDialog.title', { name })
      }
      width={420}
    >
      {link && ready && (
        <LimitForm
          mode={mode}
          link={link}
          defaultLimit={settings.data?.defaultClientLimit ?? null}
          onClose={onClose}
        />
      )}
    </Dialog>
  )
}

/** Mounted with each opening, from the link's own limit, or the bank's default for a confirmation. */
function LimitForm({
  mode,
  link,
  defaultLimit,
  onClose,
}: {
  mode: LimitDialogProps['mode']
  link: TraderLinkDto
  defaultLimit: number | null
  onClose: () => void
}) {
  const { t } = useTranslation()
  const confirm = useConfirmLink()
  const change = useChangeLinkLimit()
  const mutation = mode === 'confirm' ? confirm : change
  const initial = mode === 'confirm' ? (link.dailyLimit ?? defaultLimit) : link.dailyLimit
  const [unlimited, setUnlimited] = useState(initial === null)
  const [amount, setAmount] = useState<number | null>(initial)
  const [submitted, setSubmitted] = useState(false)
  const invalid = !unlimited && (amount === null || amount <= 0 || !Number.isInteger(amount))
  const fieldError =
    (submitted && invalid ? t('rfq.links.errors.limit') : undefined) ??
    (isApiError(mutation.error, 400) ? mutation.error.problem.errors?.dailyLimit?.[0] : undefined)
  const otherError =
    mutation.error && !isApiError(mutation.error, 400) ? mutation.error.message : undefined

  return (
    <form
      noValidate
      className="contents"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (invalid) return
        const variables = { linkId: link.id, dailyLimit: unlimited ? null : amount }
        const onSuccess = () => {
          toast.success(
            mode === 'confirm'
              ? t('rfq.links.confirmDialog.done', { name: link.trader.name })
              : t('rfq.links.limitDialog.done', { name: link.trader.name }),
          )
          onClose()
        }
        if (mode === 'confirm') confirm.mutate(variables, { onSuccess })
        else change.mutate(variables, { onSuccess })
      }}
    >
      <DialogBody>
        <Checkbox
          checked={unlimited}
          onChange={setUnlimited}
          label={t('rfq.links.confirmDialog.noLimit')}
        />
        <Field label={t('rfq.links.confirmDialog.limit')} error={fieldError}>
          <NumberInput
            value={unlimited ? null : amount}
            onChange={setAmount}
            decimals={0}
            suffix="XAF"
            disabled={unlimited}
            highlight={!unlimited}
          />
        </Field>
        {mode === 'confirm' && (
          <p className="font-sans text-data text-secondary">{t('rfq.links.confirmDialog.note')}</p>
        )}
        {otherError && (
          <p role="alert" className="font-sans text-data text-down">
            {otherError}
          </p>
        )}
      </DialogBody>
      <DialogFooter>
        <Button type="button" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button
          type="submit"
          variant={mode === 'confirm' ? 'success' : 'primary'}
          busy={mutation.isPending}
        >
          {mode === 'confirm'
            ? t('rfq.links.confirmDialog.submit')
            : t('rfq.links.limitDialog.submit')}
        </Button>
      </DialogFooter>
    </form>
  )
}
