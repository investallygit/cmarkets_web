import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePortfolios } from '@/entities/portfolio'
import { useWatchlists } from '@/entities/watchlist'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { Select } from '@/shared/ui/form/Select'
import { useImportUniverse } from '../model/useImportUniverse'

type Source = 'portfolio' | 'watchlist'

/** Panel 1's "From a portfolio" and "From a watchlist": a list to pick, its securities taken. */
export function ImportUniverseButtons() {
  const { t } = useTranslation()
  const [source, setSource] = useState<Source | null>(null)
  return (
    <>
      <Button variant="link" size="sm" onClick={() => setSource('portfolio')}>
        {t('opt.universe.fromPortfolio')}
      </Button>
      <Button variant="link" size="sm" onClick={() => setSource('watchlist')}>
        {t('opt.universe.fromWatchlist')}
      </Button>
      {source && <ImportDialog source={source} onClose={() => setSource(null)} />}
    </>
  )
}

function ImportDialog({ source, onClose }: { source: Source; onClose: () => void }) {
  const { t } = useTranslation()
  const portfolios = usePortfolios({ enabled: source === 'portfolio' })
  const watchlists = useWatchlists()
  const { fromPortfolio, fromWatchlist } = useImportUniverse()
  const options =
    source === 'portfolio'
      ? (portfolios.data ?? []).map((portfolio) => ({ value: portfolio.id, label: portfolio.name }))
      : (watchlists.data ?? []).map((list) => ({
          value: list.id,
          label: `${list.code} · ${list.name}`,
        }))
  const [chosen, setChosen] = useState('')
  const value = chosen || options[0]?.value || ''
  const [busy, setBusy] = useState(false)

  const take = async () => {
    if (!value) return
    setBusy(true)
    await (source === 'portfolio' ? fromPortfolio(value) : fromWatchlist(value))
    setBusy(false)
    onClose()
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={
        source === 'portfolio' ? t('opt.universe.fromPortfolio') : t('opt.universe.fromWatchlist')
      }
      width={420}
    >
      <DialogBody>
        <Field
          label={
            source === 'portfolio'
              ? t('opt.universe.pickPortfolio')
              : t('opt.universe.pickWatchlist')
          }
        >
          <Select value={value} options={options} onChange={setChosen} className="w-full" />
        </Field>
      </DialogBody>
      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          {t('opt.objective.cancel')}
        </Button>
        <Button variant="primary" busy={busy} disabled={!value} onClick={() => void take()}>
          {t('opt.universe.take')}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
