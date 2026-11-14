import { Download } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useExportRfqAudit } from '@/entities/platform-settings'
import { useFormat } from '@/shared/i18n'
import { saveBlob } from '@/shared/lib/download'
import { Button } from '@/shared/ui/form/Button'
import { DateInput } from '@/shared/ui/form/DateInput'
import { Field } from '@/shared/ui/form/Field'
import { toast } from '@/shared/ui/toast'

/** A year of events at most in one file, as CMarket.Api allows. */
const MAX_DAYS = 366
const DAY_MS = 86_400_000

/**
 * The RFQ's compliance export (spec section 10, GET /admin/rfq/audit; ROADMAP decisions 17 and 18):
 * every request, answer, improvement, selection, confirmation and agreement between two days, to
 * the millisecond, as CSV. The Admin's (rfq:report), readable while the module is off.
 */
export function RfqAuditExport() {
  const { t } = useTranslation()
  const format = useFormat()
  // Today, in the user's time zone (Douala by default), when the panel opens.
  const [from, setFrom] = useState<string | null>(() => format.day(Date.now()))
  const [to, setTo] = useState<string | null>(() => format.day(Date.now()))
  const exporting = useExportRfqAudit()
  const invalid =
    !from || !to || from > to || (Date.parse(to) - Date.parse(from)) / DAY_MS >= MAX_DAYS

  return (
    <div className="flex flex-col gap-2 p-2">
      <div className="grid grid-cols-2 gap-2">
        <Field label={t('rfqTrading.audit.from')}>
          <DateInput value={from} onChange={setFrom} />
        </Field>
        <Field
          label={t('rfqTrading.audit.to')}
          error={from && to && invalid ? t('rfqTrading.audit.errors.period') : undefined}
        >
          <DateInput value={to} onChange={setTo} />
        </Field>
      </div>
      <p className="font-sans text-label text-secondary">{t('rfqTrading.audit.hint')}</p>
      <div>
        <Button
          icon={Download}
          busy={exporting.isPending}
          disabled={invalid}
          onClick={() =>
            from &&
            to &&
            exporting.mutate(
              { from, to },
              {
                onSuccess: (blob) => saveBlob(blob, `cmarket-rfq-audit-${from}-${to}.csv`),
                onError: (error) => toast.error(error.message),
              },
            )
          }
        >
          {t('rfqTrading.audit.download')}
        </Button>
      </div>
    </div>
  )
}
