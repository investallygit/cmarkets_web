import { FileSpreadsheet, FileText } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEnsureSaved } from '@/entities/optimizer'
import type { OptExportFormat } from '@/shared/api/contracts'
import { optimizerApi } from '@/shared/api/endpoints'
import { saveBlob } from '@/shared/lib/download'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { TextInput } from '@/shared/ui/form/TextInput'
import { toast } from '@/shared/ui/toast'

/** Screen 29's export (GET /optimizer/scenarios/{id}/export): the scenario saved first, then XLSX or PDF. */
export function ExportScenarioDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const saved = useEnsureSaved()
  const [scenarioName, setScenarioName] = useState(saved.defaultName)
  const [busy, setBusy] = useState<OptExportFormat | null>(null)

  const download = async (format: OptExportFormat) => {
    setBusy(format)
    try {
      const id = await saved.ensure(scenarioName.trim())
      const blob = await optimizerApi.exportScenario(id, format)
      saveBlob(blob, `${scenarioName.trim() || 'optimisation'}.${format}`)
      onClose()
    } catch (error) {
      toast.error(t('opt.export.failed', { message: (error as Error).message }))
    } finally {
      setBusy(null)
    }
  }
  const ready = !saved.needsSave || scenarioName.trim().length > 0

  return (
    <Dialog open onClose={onClose} title={t('opt.export.title')} width={420}>
      <DialogBody>
        {saved.needsSave && (
          <Field label={t('opt.toPortfolio.scenarioName')} hint={t('opt.toPortfolio.scenarioHint')}>
            <TextInput value={scenarioName} onChange={setScenarioName} maxLength={80} autoFocus />
          </Field>
        )}
        <p className="font-sans text-data text-secondary">{t('opt.adviceResult')}</p>
      </DialogBody>
      <DialogFooter>
        <Button
          variant="secondary"
          icon={FileSpreadsheet}
          busy={busy === 'xlsx'}
          disabled={!ready || busy !== null}
          onClick={() => void download('xlsx')}
        >
          {t('opt.export.xlsx')}
        </Button>
        <Button
          variant="secondary"
          icon={FileText}
          busy={busy === 'pdf'}
          disabled={!ready || busy !== null}
          onClick={() => void download('pdf')}
        >
          {t('opt.export.pdf')}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
