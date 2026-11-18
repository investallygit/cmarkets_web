import { AlertTriangle, CircleCheck, CircleX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  checkBlocker,
  useCurrentCheck,
  useOptimizer,
  useOptimizerTexts,
} from '@/entities/optimizer'
import type { OptCheckItemDto } from '@/shared/api/contracts'
import { Panel } from '@/shared/ui/Panel'
import { mayRetry } from '@/shared/ui/retry'
import { ScrollArea } from '@/shared/ui/ScrollArea'
import { InlineError } from '@/shared/ui/StatusViews'

/**
 * Screen 28's pre-run checks (POST /optimizer/check): the constraints compatible or those in
 * conflict, the target within the reachable range, the estimates, the illiquid securities. An
 * error stops OPTIMISE (spec: "the calculation does not run"). A setup that cannot be checked says
 * why, not the last setup's answer (B36); a check the API refuses or that fails says so (B58).
 */
export function PreRunChecksPanel() {
  const { t } = useTranslation()
  const { check } = useCurrentCheck()
  const setup = useOptimizer((state) => state.setup)
  const total = setup.universe.length
  const blocker = checkBlocker(setup)
  return (
    <Panel title={t('opt.checks.title')} code="OPT">
      <div className="flex h-full flex-col">
        <ScrollArea className="min-h-0 flex-1">
          {blocker ? (
            <p className="p-3 font-sans text-data text-secondary">
              {t(`opt.checks.blocked.${blocker}`, { count: total })}
            </p>
          ) : check.isError ? (
            <p className="p-3 font-sans text-data">
              <InlineError
                message={t('opt.checks.failed', { message: check.error.message })}
                onRetry={mayRetry(check.error) ? () => void check.refetch() : undefined}
              />
            </p>
          ) : !check.data ? (
            <p className="p-3 font-sans text-data text-secondary">{t('opt.checks.waiting')}</p>
          ) : (
            <ul className="space-y-3 p-3 font-sans text-data" aria-live="polite">
              {check.data.items.map((item) => (
                <CheckLine
                  key={item.code}
                  item={item}
                  total={total}
                  returnRange={check.data.returnRange}
                  riskRange={check.data.riskRange}
                  estimated={check.data.estimated}
                />
              ))}
            </ul>
          )}
        </ScrollArea>
        <p className="shrink-0 border-t px-3 py-2 font-sans text-data text-secondary">
          {t('opt.advice')}
        </p>
      </div>
    </Panel>
  )
}

interface CheckLineProps {
  item: OptCheckItemDto
  total: number
  estimated: number
  returnRange: { minPct: number; maxPct: number } | null
  riskRange: { minPct: number; maxPct: number } | null
}

function CheckLine({ item, total, estimated, returnRange, riskRange }: CheckLineProps) {
  const { t } = useTranslation()
  const texts = useOptimizerTexts()
  const list = (ids: readonly string[]) => ids.map(texts.code).join(', ')
  const ok = item.status === 'ok'
  const range = returnRange
    ? t('opt.checks.returnRange', {
        min: texts.pct(returnRange.minPct),
        max: texts.pct(returnRange.maxPct),
      })
    : null
  const risks = riskRange
    ? t('opt.checks.riskRange', {
        min: texts.pct(riskRange.minPct),
        max: texts.pct(riskRange.maxPct),
      })
    : null

  let title: string
  let detail: string | null = null
  switch (item.code) {
    case 'constraints':
      title = t(ok ? 'opt.checks.constraintsOk' : 'opt.checks.constraintsError')
      detail = ok
        ? null
        : t('opt.checks.involved', { list: item.constraints.map(texts.constraint).join(' · ') })
      break
    case 'target':
      if (item.constraints[0]?.kind === 'targetRisk') {
        title = t(ok ? 'opt.checks.targetRiskOk' : 'opt.checks.targetRiskError')
        detail = risks
      } else {
        title = t(ok ? 'opt.checks.targetReturnOk' : 'opt.checks.targetReturnError')
        detail = range
      }
      break
    case 'sharpe':
      title = t(ok ? 'opt.checks.sharpeOk' : 'opt.checks.sharpeError')
      detail = range
      break
    case 'history':
      title = t(ok ? 'opt.checks.historyOk' : 'opt.checks.historyError')
      detail = ok
        ? t('opt.checks.historyCount', { count: estimated, total })
        : t('opt.checks.historyMissing', { list: list(item.securityIds) })
      break
    case 'illiquid':
      title = t(ok ? 'opt.checks.illiquidOk' : 'opt.checks.illiquidWarning')
      detail = ok ? null : t('opt.checks.illiquidDetail', { list: list(item.securityIds) })
      break
    case 'frequency':
      title = t('opt.checks.frequencyError')
      detail = t('opt.checks.frequencyDetail', { list: list(item.securityIds) })
      break
    case 'correlations':
      title = t('opt.checks.correlationsError')
      detail = t('opt.checks.correlationsDetail')
      break
  }

  const Icon =
    item.status === 'ok' ? CircleCheck : item.status === 'warning' ? AlertTriangle : CircleX
  const tone =
    item.status === 'ok' ? 'text-up' : item.status === 'warning' ? 'text-warning' : 'text-down'
  return (
    <li className="flex gap-2">
      <Icon size={18} className={`mt-0.5 shrink-0 ${tone}`} aria-hidden />
      <div>
        <p className="text-primary">
          <span className="sr-only">{t(`opt.checks.statuses.${item.status}`)} </span>
          {title}
        </p>
        {detail && <p className={item.status === 'ok' ? 'text-secondary' : tone}>{detail}</p>}
      </div>
    </li>
  )
}
