import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEnsureSaved, useOptRebalance } from '@/entities/optimizer'
import { usePortfolios } from '@/entities/portfolio'
import type { OptRebalanceDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { Select } from '@/shared/ui/form/Select'
import { TextInput } from '@/shared/ui/form/TextInput'
import { toast } from '@/shared/ui/toast'

/**
 * Screen 29's "Trades to adjust" (POST /optimizer/scenarios/{id}/rebalance): the sales and purchases
 * that would bring a portfolio to the allocation, at the last prices; for information, CMarket
 * sends no orders.
 */
export function RebalanceDialog({
  portfolioId,
  onClose,
}: {
  portfolioId: string | null
  onClose: () => void
}) {
  const { t } = useTranslation()
  const format = useFormat()
  const portfolios = usePortfolios()
  const saved = useEnsureSaved()
  const rebalance = useOptRebalance()
  const [chosen, setChosen] = useState(portfolioId ?? '')
  const [scenarioName, setScenarioName] = useState(saved.defaultName)
  const [trades, setTrades] = useState<OptRebalanceDto | null>(null)
  const options = (portfolios.data ?? []).map((portfolio) => ({
    value: portfolio.id,
    label: portfolio.name,
  }))
  const value = chosen || options[0]?.value || ''
  const ready = value !== '' && (!saved.needsSave || scenarioName.trim().length > 0)

  const compute = async () => {
    try {
      const scenarioId = await saved.ensure(scenarioName.trim())
      setTrades(await rebalance.mutateAsync({ scenarioId, portfolioId: value }))
    } catch (error) {
      toast.error(t('opt.rebalance.failed', { message: (error as Error).message }))
    }
  }
  const amount = (value: number) => format.number(value, 0)

  return (
    <Dialog open onClose={onClose} title={t('opt.rebalance.title')} width={720}>
      <DialogBody>
        <div className="flex flex-wrap items-end gap-2">
          <Field label={t('opt.rebalance.portfolio')}>
            <Select
              value={value}
              options={options}
              onChange={(id) => {
                setChosen(id)
                setTrades(null)
              }}
              className="w-64"
            />
          </Field>
          {saved.needsSave && (
            <Field label={t('opt.toPortfolio.scenarioName')}>
              <TextInput value={scenarioName} onChange={setScenarioName} maxLength={80} />
            </Field>
          )}
          <Button
            variant="primary"
            busy={rebalance.isPending}
            disabled={!ready}
            onClick={() => void compute()}
          >
            {t('opt.nextSteps.tradesAny')}
          </Button>
        </div>
        <p className="mt-2 font-sans text-data text-warning">{t('opt.rebalance.info')}</p>
        {trades && (
          <div className="mt-2 space-y-2">
            <p className="font-sans text-data text-secondary">
              {t('opt.rebalance.value', {
                value: amount(trades.totalValue),
                date: format.isoDate(trades.asOf),
              })}
            </p>
            <table className="w-full border-collapse font-mono text-data tabular-nums">
              <thead className="bg-panel-header font-sans text-secondary">
                <tr>
                  <th scope="col" className="px-2 py-1 text-left font-normal">
                    {t('opt.rebalance.columns.security')}
                  </th>
                  <th scope="col" className="px-2 py-1 text-left font-normal">
                    {t('opt.rebalance.columns.side')}
                  </th>
                  <th scope="col" className="px-2 py-1 text-right font-normal">
                    {t('opt.rebalance.columns.current')}
                  </th>
                  <th scope="col" className="px-2 py-1 text-right font-normal">
                    {t('opt.rebalance.columns.target')}
                  </th>
                  <th scope="col" className="px-2 py-1 text-right font-normal">
                    {t('opt.rebalance.columns.quantity')}
                  </th>
                  <th scope="col" className="px-2 py-1 text-right font-normal">
                    {t('opt.rebalance.columns.amount')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {trades.trades.map((trade) => (
                  <tr key={trade.securityId} className="border-b">
                    <th
                      scope="row"
                      className="px-2 py-1 text-left font-normal text-accent-amber"
                      title={trade.name}
                    >
                      {trade.code}
                    </th>
                    <td
                      className={`px-2 py-1 font-sans ${trade.side === 'buy' ? 'text-up' : trade.side === 'sell' ? 'text-down' : 'text-secondary'}`}
                    >
                      {t(`opt.rebalance.sides.${trade.side}`)}
                    </td>
                    <td className="px-2 py-1 text-right">
                      {format.number(trade.currentQuantity, 0)} ·{' '}
                      {format.percent(trade.currentWeightPct, 1, false)}
                    </td>
                    <td className="px-2 py-1 text-right">
                      {format.number(trade.targetQuantity, 0)} ·{' '}
                      {format.percent(trade.targetWeightPct, 1, false)}
                    </td>
                    <td className="px-2 py-1 text-right">{format.number(trade.quantity, 0)}</td>
                    <td className="px-2 py-1 text-right">{amount(trade.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="font-sans text-data text-primary">
              {t('opt.rebalance.totals', {
                sells: amount(trades.sellAmount),
                buys: amount(trades.buyAmount),
                cash: amount(trades.cashAfter),
              })}
            </p>
          </div>
        )}
      </DialogBody>
      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          {t('opt.rebalance.close')}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
