import { clsx } from 'clsx'
import { Search } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { SHARED_CHART_PERIODS } from '@/entities/conversation'
import { useLibrary } from '@/entities/publication'
import { useSecurities } from '@/entities/security'
import type { FrozenChartPeriod, SharedObjectInputDto } from '@/shared/api/contracts'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { SegmentedControl } from '@/shared/ui/form/SegmentedControl'
import { TextInput } from '@/shared/ui/form/TextInput'

/** What the composer's buttons share; a news item is shared from its article (features/share-news). */
export type ShareKind = Exclude<SharedObjectInputDto['type'], 'news'>

/** What the composer shows of the object chosen, before the server freezes it. */
export interface PendingShare {
  input: SharedObjectInputDto
  label: string
}

interface ShareDialogProps {
  kind: ShareKind | null
  onClose: () => void
  onShare: (share: PendingShare) => void
}

const TITLES = {
  security: 'messaging.composer.shareSecurity',
  chart: 'messaging.composer.shareChart',
  publication: 'messaging.composer.sharePublication',
} as const

/** A choice in a list: the button pressed is the one chosen. */
function Choice({
  selected,
  onSelect,
  children,
}: {
  selected: boolean
  onSelect: () => void
  children: ReactNode
}) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
        className={clsx(
          'flex w-full items-baseline gap-3 border-l-2 px-2 py-1.5 text-left',
          selected ? 'border-accent-amber bg-selected' : 'border-transparent hover:bg-panel-header',
        )}
      >
        {children}
      </button>
    </li>
  )
}

/** "Share a security", "Share a chart", "Share a publication" (spec section 9, screen 11). */
export function ShareDialog({ kind, onClose, onShare }: ShareDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog open={kind !== null} onClose={onClose} title={kind ? t(TITLES[kind]) : ''} width={520}>
      {kind && <ShareForm key={kind} kind={kind} onClose={onClose} onShare={onShare} />}
    </Dialog>
  )
}

function ShareForm({
  kind,
  onClose,
  onShare,
}: { kind: ShareKind } & Omit<ShareDialogProps, 'kind'>) {
  const { t } = useTranslation()
  const [q, setQ] = useState('')
  const [chosen, setChosen] = useState<{ id: string; label: string } | null>(null)
  const [period, setPeriod] = useState<FrozenChartPeriod>('1Y')
  const text = q.trim().toLowerCase()
  const securities = useSecurities({}, { enabled: kind !== 'publication' })
  const library = useLibrary({
    tab: 'all',
    q: kind === 'publication' && text ? text : undefined,
    sort: 'recent',
    page: 1,
    pageSize: 20,
  })
  const securityItems = (securities.data ?? []).filter(
    (security) =>
      !text ||
      security.code.toLowerCase().includes(text) ||
      security.name.toLowerCase().includes(text),
  )

  const share = () => {
    if (!chosen) return
    const input: SharedObjectInputDto =
      kind === 'security'
        ? { type: 'security', securityId: chosen.id }
        : kind === 'chart'
          ? { type: 'chart', securityId: chosen.id, period }
          : { type: 'publication', publicationId: chosen.id }
    onShare({ input, label: kind === 'chart' ? `${chosen.label} · ${period}` : chosen.label })
    onClose()
  }

  return (
    <form
      className="contents"
      onSubmit={(event) => {
        event.preventDefault()
        share()
      }}
    >
      <DialogBody>
        <TextInput
          type="search"
          icon={Search}
          value={q}
          onChange={setQ}
          placeholder={
            kind === 'publication'
              ? t('messaging.share.searchPublication')
              : t('messaging.share.searchSecurity')
          }
          aria-label={
            kind === 'publication'
              ? t('messaging.share.publication')
              : t('messaging.share.security')
          }
        />
        <ul className="flex max-h-64 flex-col overflow-y-auto border">
          {kind === 'publication'
            ? (library.data?.items ?? []).map((item) => (
                <Choice
                  key={item.id}
                  selected={chosen?.id === item.id}
                  onSelect={() => setChosen({ id: item.id, label: item.title })}
                >
                  <span className="min-w-0 flex-1 truncate font-sans text-label">{item.title}</span>
                  <span className="shrink-0 font-sans text-data text-secondary">
                    {item.analyst.displayName}
                  </span>
                </Choice>
              ))
            : securityItems.map((security) => (
                <Choice
                  key={security.id}
                  selected={chosen?.id === security.id}
                  onSelect={() => setChosen({ id: security.id, label: security.code })}
                >
                  <span className="w-40 shrink-0 font-mono text-data font-semibold">
                    {security.code}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-sans text-data text-secondary">
                    {security.name}
                  </span>
                </Choice>
              ))}
        </ul>
        {kind === 'publication' && library.data?.items.length === 0 && (
          <p className="font-sans text-data text-secondary">{t('messaging.share.noPublication')}</p>
        )}
        {kind === 'chart' && (
          <Field label={t('messaging.share.period')} group>
            <SegmentedControl
              value={period}
              onChange={setPeriod}
              options={SHARED_CHART_PERIODS.map((value) => ({ value, label: value }))}
            />
          </Field>
        )}
      </DialogBody>
      <DialogFooter>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" variant="primary" disabled={!chosen}>
          {t('messaging.share.add')}
        </Button>
      </DialogFooter>
    </form>
  )
}
