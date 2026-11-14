import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useIndices } from '@/entities/market'
import { useEnsureSaved } from '@/entities/optimizer'
import { portfolioKeys } from '@/entities/portfolio'
import { useCurrentUser } from '@/entities/session'
import type { OptToPortfolioDto, PortfolioSummaryDto } from '@/shared/api/contracts'
import { optimizerApi } from '@/shared/api/endpoints'
import { routes } from '@/shared/routes/paths'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { Select } from '@/shared/ui/form/Select'
import { TextInput } from '@/shared/ui/form/TextInput'
import { toast } from '@/shared/ui/toast'

const NAME_MAX = 40
/** The market-cap ranking of GET /indices is no benchmark (PORT's dialog leaves it out too). */
const NOT_A_BENCHMARK = 'MCAP'

/**
 * Screen 29's "Save as model portfolio" and "Create a portfolio from the allocation"
 * (POST /optimizer/scenarios/{id}/to-portfolio): the scenario saved first when it is not, then the
 * portfolio made in PORT; a Student, a model portfolio only.
 */
export function ToPortfolioDialog({
  kind,
  onClose,
}: {
  kind: OptToPortfolioDto['kind']
  onClose: () => void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const client = useQueryClient()
  const me = useCurrentUser()
  const indices = useIndices()
  const saved = useEnsureSaved()
  const [scenarioName, setScenarioName] = useState(saved.defaultName)
  const [name, setName] = useState(saved.defaultName.slice(0, NAME_MAX))
  const [benchmark, setBenchmark] = useState('BVMAC-A')
  const create = useMutation({
    mutationFn: async () => {
      const id = await saved.ensure(scenarioName.trim())
      return optimizerApi.toPortfolio(id, { name: name.trim(), kind, benchmark })
    },
    onSuccess: (portfolio) => {
      // In the list at once, as PORT's own "New portfolio" does: PORT opens it before the list is
      // fetched again, instead of falling back to the first portfolio.
      client.setQueryData<PortfolioSummaryDto[]>(portfolioKeys.list(), (list) =>
        list ? [...list, portfolio] : list,
      )
      client.setQueryData(portfolioKeys.detail(portfolio.id), portfolio)
      void client.invalidateQueries({ queryKey: portfolioKeys.list() })
      toast.success(t('opt.toPortfolio.created', { name: portfolio.name }))
      onClose()
      void navigate(`${routes.portfolio}/${portfolio.id}`)
    },
    onError: (error) => toast.error(t('opt.toPortfolio.failed', { message: error.message })),
  })
  const student = me.accountType === 'student'
  const blocked = kind === 'real' && student
  const valid =
    name.trim().length > 0 &&
    name.trim().length <= NAME_MAX &&
    (!saved.needsSave || scenarioName.trim().length > 0)
  const benchmarks = (indices.data ?? [])
    .filter((index) => index.code !== NOT_A_BENCHMARK)
    .map((index) => ({ value: index.code, label: `${index.code} · ${index.name}` }))

  return (
    <Dialog
      open
      onClose={onClose}
      title={t(kind === 'model' ? 'opt.toPortfolio.modelTitle' : 'opt.toPortfolio.realTitle')}
      width={460}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (valid && !blocked) create.mutate()
        }}
      >
        <DialogBody>
          <p className="mb-2 font-sans text-data text-secondary">
            {blocked
              ? t('opt.toPortfolio.studentOnly')
              : t(kind === 'model' ? 'opt.toPortfolio.modelHint' : 'opt.toPortfolio.realHint')}
          </p>
          {saved.needsSave && (
            <Field
              label={t('opt.toPortfolio.scenarioName')}
              hint={t('opt.toPortfolio.scenarioHint')}
            >
              <TextInput value={scenarioName} onChange={setScenarioName} maxLength={80} autoFocus />
            </Field>
          )}
          <Field label={t('opt.toPortfolio.name')}>
            <TextInput
              value={name}
              onChange={setName}
              maxLength={NAME_MAX}
              autoFocus={!saved.needsSave}
            />
          </Field>
          <Field label={t('opt.toPortfolio.benchmark')}>
            <Select
              value={benchmark}
              options={
                benchmarks.length > 0 ? benchmarks : [{ value: benchmark, label: benchmark }]
              }
              onChange={setBenchmark}
            />
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" type="button" onClick={onClose}>
            {t('opt.objective.cancel')}
          </Button>
          <Button
            variant="primary"
            type="submit"
            busy={create.isPending}
            disabled={!valid || blocked}
          >
            {t('opt.toPortfolio.create')}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
