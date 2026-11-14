import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRequestSvt } from '@/entities/svt-link'
import { isApiError } from '@/shared/api'
import type { LicensedSvtDto } from '@/shared/api/contracts'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { Select } from '@/shared/ui/form/Select'
import { toast } from '@/shared/ui/toast'

interface AddSvtDialogProps {
  open: boolean
  onClose: () => void
  /** The licensed SVTs the trader has no link in force with. */
  svts: readonly LicensedSvtDto[]
}

/**
 * "Add an SVT" of screen 22's "My SVTs" (POST /me/svt): the bank's SVT accounts are told by
 * e-mail and confirm the link in their workspace (TRD); the request waits 7 days.
 */
export function AddSvtDialog({ open, onClose, svts }: AddSvtDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onClose={onClose} title={t('rfq.mySvts.dialog.title')} width={420}>
      <AddSvtForm onClose={onClose} svts={svts} />
    </Dialog>
  )
}

/** Mounted with each opening, so no SVT is chosen at first. */
function AddSvtForm({ onClose, svts }: Omit<AddSvtDialogProps, 'open'>) {
  const { t } = useTranslation()
  const request = useRequestSvt()
  const [svtId, setSvtId] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const chosen = svts.find((svt) => svt.id === svtId)
  const fieldError =
    (submitted && !chosen ? t('rfq.mySvts.dialog.choose') : undefined) ??
    (isApiError(request.error, 400) ? request.error.problem.errors?.svtId?.[0] : undefined)
  const otherError =
    request.error && !isApiError(request.error, 400) ? request.error.message : undefined

  return (
    <form
      noValidate
      className="contents"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (!chosen) return
        request.mutate(
          { svtId: chosen.id },
          {
            onSuccess: () => {
              toast.success(t('rfq.mySvts.dialog.sent', { name: chosen.name }))
              onClose()
            },
          },
        )
      }}
    >
      <DialogBody>
        {svts.length === 0 ? (
          <p className="font-sans text-data text-secondary">{t('rfq.mySvts.dialog.none')}</p>
        ) : (
          <Field label={t('rfq.mySvts.dialog.svt')} error={fieldError}>
            <Select
              value={svtId}
              options={[
                { value: '', label: t('rfq.mySvts.dialog.choose') },
                ...svts.map((svt) => ({
                  value: svt.id,
                  label: t('rfq.mySvts.svtName', { name: svt.name }),
                })),
              ]}
              onChange={setSvtId}
              highlight
              autoFocus
            />
          </Field>
        )}
        <p className="font-sans text-data text-secondary">{t('rfq.mySvts.dialog.note')}</p>
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
          variant="primary"
          busy={request.isPending}
          disabled={svts.length === 0}
        >
          {t('rfq.mySvts.dialog.submit')}
        </Button>
      </DialogFooter>
    </form>
  )
}
