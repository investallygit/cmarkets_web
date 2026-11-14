import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { ToPortfolioDialog } from '@/features/create-portfolio-from-allocation'
import { ExportScenarioDialog } from '@/features/export-opt-scenario'
import { RebalanceDialog } from '@/features/rebalance-portfolio'
import { useHasPermission } from '@/entities/session'
import type { OptResultDto } from '@/shared/api/contracts'
import { routes } from '@/shared/routes/paths'
import { Button } from '@/shared/ui/form/Button'
import { Panel } from '@/shared/ui/Panel'
import { ScrollArea } from '@/shared/ui/ScrollArea'

type Step = 'model' | 'real' | 'trades' | 'export'

/**
 * Screen 29's next steps: save the allocation as a model portfolio, create a portfolio from it,
 * the trades that would adjust a portfolio, the XLSX and PDF export, back to the setup.
 */
export function NextStepsPanel({ result }: { result: OptResultDto }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const canWrite = useHasPermission('portfolios:write')
  const [step, setStep] = useState<Step | null>(null)
  const compared = result.frontier.portfolio
  return (
    <Panel title={t('opt.nextSteps.title')} code="OPT RES">
      <ScrollArea className="h-full">
        <div className="flex flex-col gap-2 p-2">
          <Button
            variant="primary"
            size="lg"
            disabled={!canWrite}
            onClick={() => setStep('model')}
            className="justify-center uppercase"
          >
            {t('opt.nextSteps.saveModel')}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            disabled={!canWrite}
            onClick={() => setStep('real')}
            className="justify-center"
          >
            {t('opt.nextSteps.createPortfolio')}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setStep('trades')}
            className="justify-center"
          >
            {compared
              ? t('opt.nextSteps.trades', { name: compared.name })
              : t('opt.nextSteps.tradesAny')}
          </Button>
          <Button
            variant="info"
            size="lg"
            onClick={() => setStep('export')}
            className="justify-center"
          >
            {t('opt.nextSteps.export')}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => void navigate(routes.optimizer)}
            className="justify-center text-secondary"
          >
            {t('opt.nextSteps.editSetup')}
          </Button>
          <p className="mt-2 font-sans text-data text-secondary">{t('opt.adviceResult')}</p>
        </div>
      </ScrollArea>
      {(step === 'model' || step === 'real') && (
        <ToPortfolioDialog kind={step} onClose={() => setStep(null)} />
      )}
      {step === 'trades' && (
        <RebalanceDialog
          portfolioId={compared?.portfolioId ?? null}
          onClose={() => setStep(null)}
        />
      )}
      {step === 'export' && <ExportScenarioDialog onClose={() => setStep(null)} />}
    </Panel>
  )
}
