import { FilePlus2, Save, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import {
  leaveScenario,
  newSetup,
  useDeleteScenario,
  useOptimizer,
  useOptScenarios,
} from '@/entities/optimizer'
import { optimizerPath } from '@/shared/routes/paths'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Button } from '@/shared/ui/form/Button'
import { Select } from '@/shared/ui/form/Select'
import { InlineError } from '@/shared/ui/StatusViews'
import { toast } from '@/shared/ui/toast'
import { SaveScenarioDialog } from './SaveScenarioDialog'

/**
 * The scenarios of OPT (spec section 9: "a scenario can be reopened, duplicated and recomputed with
 * today's data"): the one open, chosen among the user's; saved again on today's data, saved as a
 * copy, deleted; a new setup.
 */
export function ScenarioBar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const scenario = useOptimizer((state) => state.scenario)
  const universe = useOptimizer((state) => state.setup.universe.length)
  const scenarios = useOptScenarios()
  const remove = useDeleteScenario()
  const [saving, setSaving] = useState<'save' | 'copy' | null>(null)
  const [deleting, setDeleting] = useState(false)

  const listed = (scenarios.data ?? []).map((item) => ({ value: item.id, label: item.name }))
  const options = [
    ...(scenario ? [] : [{ value: '', label: t('opt.scenario.unsaved') }]),
    // The open scenario stays chosen while the list loads, or once saved under a new name.
    ...(scenario && !listed.some((item) => item.value === scenario.id)
      ? [{ value: scenario.id, label: scenario.name }]
      : []),
    ...listed,
  ]

  return (
    <div className="flex flex-wrap items-center gap-1 font-sans text-data">
      <Select<string>
        value={scenario?.id ?? ''}
        options={options}
        prefix={`${t('opt.scenario.label')}:`}
        onChange={(id) => id && void navigate(optimizerPath({ scenario: id }))}
        aria-label={t('opt.scenario.label')}
        className="w-64"
      />
      <Button
        variant="secondary"
        size="sm"
        icon={Save}
        disabled={universe < 2}
        onClick={() => setSaving('save')}
      >
        {t('opt.scenario.save')}
      </Button>
      {scenario && (
        <>
          <Button variant="secondary" size="sm" onClick={() => setSaving('copy')}>
            {t('opt.scenario.saveAs')}
          </Button>
          <Button variant="danger" size="sm" icon={Trash2} onClick={() => setDeleting(true)}>
            {t('opt.scenario.delete')}
          </Button>
        </>
      )}
      {scenarios.isError && (
        <InlineError
          message={t('opt.scenario.listFailed')}
          onRetry={() => void scenarios.refetch()}
        />
      )}
      <Button
        variant="secondary"
        size="sm"
        icon={FilePlus2}
        onClick={() => {
          newSetup()
          void navigate(optimizerPath())
        }}
      >
        {t('opt.scenario.new')}
      </Button>
      {saving && <SaveScenarioDialog copy={saving === 'copy'} onClose={() => setSaving(null)} />}
      {scenario && (
        <ConfirmDialog
          open={deleting}
          onClose={() => setDeleting(false)}
          title={t('opt.scenario.deleteTitle')}
          message={t('opt.scenario.deleteConfirm', { name: scenario.name })}
          confirmLabel={t('opt.scenario.delete')}
          tone="danger"
          busy={remove.isPending}
          onConfirm={() =>
            remove.mutate(scenario.id, {
              onSuccess: () => {
                leaveScenario()
                setDeleting(false)
                toast.success(t('opt.scenario.deleted', { name: scenario.name }))
                void navigate(optimizerPath(), { replace: true })
              },
              onError: (error) =>
                toast.error(t('opt.scenario.deleteFailed', { message: error.message })),
            })
          }
        />
      )}
    </div>
  )
}
