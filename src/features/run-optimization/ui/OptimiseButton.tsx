import { Play } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { showResult, useRunOptimization, useOptimizer } from '@/entities/optimizer'
import { routes } from '@/shared/routes/paths'
import { Button } from '@/shared/ui/form/Button'
import { toast } from '@/shared/ui/toast'

/**
 * Screen 28's OPTIMISE: the setup computed on the server (POST /optimizer/run), the result shown on
 * OPT RES. Off while the pre-run check finds an error (spec: "the calculation does not run").
 */
export function OptimiseButton({ ready }: { ready: boolean }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const run = useRunOptimization()
  const optimise = () => {
    const setup = useOptimizer.getState().setup
    run.mutate(setup, {
      onSuccess: (result) => {
        showResult(result, setup)
        void navigate(routes.optimizerResult)
      },
      onError: (error) => toast.error(t('opt.objective.runFailed', { message: error.message })),
    })
  }
  return (
    <Button
      variant="primary"
      size="xl"
      icon={Play}
      busy={run.isPending}
      disabled={!ready || run.isPending}
      onClick={optimise}
      className="w-full justify-center tracking-wide uppercase"
    >
      {t('opt.objective.optimise')}
    </Button>
  )
}
