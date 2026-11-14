import { Pencil } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDailyLimit, useSvtLinks } from '@/entities/svt-link'
import { DeclineLinkButton, LimitDialog, RevokeLinkButton } from '@/features/decide-trader-link'
import type { TraderLinkDto } from '@/shared/api/contracts'
import { useFormat, useLocale } from '@/shared/i18n'
import { DataTable } from '@/shared/ui/DataTable'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { Button } from '@/shared/ui/form/Button'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

const helper = createDataColumnHelper<TraderLinkDto>()

/** Which dialog is open, on which link. */
type Editing = { mode: 'confirm' | 'limit'; link: TraderLinkDto } | null

/**
 * The trader links of the SVT's bank (TRD; screen 27's "Trader links", spec section 9; API
 * /svt/links): the requests to confirm, with the client's daily limit, or to decline, oldest
 * first; then the linked traders with their limit and link date, whose limit is changed or link
 * removed here. A colleague's decision reaches the screen through /hubs/rfq.
 */
export function TraderLinksPanel({ code = 'TRD' }: { code?: string }) {
  const { t } = useTranslation()
  const links = useSvtLinks()
  const [editing, setEditing] = useState<Editing>(null)
  const requests = (links.data?.links ?? []).filter((link) => link.status === 'pending')

  return (
    <Panel
      title={
        links.data ? `${t('panels.traderLinks')} · ${links.data.svt.name}` : t('panels.traderLinks')
      }
      code={code}
      options={<span>{t('rfq.links.requestsCount', { count: requests.length })}</span>}
    >
      <QueryView query={links}>
        {(data) => (
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto p-2">
            <section aria-labelledby="trader-link-requests" className="flex flex-col">
              <h3
                id="trader-link-requests"
                className="px-1 pb-1 font-sans text-label font-semibold tracking-title text-accent-amber uppercase"
              >
                {t('rfq.links.requests')}
              </h3>
              {requests.length === 0 ? (
                <p className="px-1 font-sans text-data text-secondary">
                  {t('rfq.links.noRequests')}
                </p>
              ) : (
                <ul className="flex flex-col">
                  {requests.map((link) => (
                    <RequestRow
                      key={link.id}
                      link={link}
                      onConfirm={() => setEditing({ mode: 'confirm', link })}
                    />
                  ))}
                </ul>
              )}
            </section>
            <LinkedTraders
              links={data.links.filter((link) => link.status === 'confirmed')}
              onChangeLimit={(link) => setEditing({ mode: 'limit', link })}
            />
          </div>
        )}
      </QueryView>
      <LimitDialog
        mode={editing?.mode ?? 'confirm'}
        link={editing?.link ?? null}
        onClose={() => setEditing(null)}
      />
    </Panel>
  )
}

function RequestRow({ link, onConfirm }: { link: TraderLinkDto; onConfirm: () => void }) {
  const { t } = useTranslation()
  const format = useFormat()
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 border-b px-1 py-2 last:border-b-0">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="font-sans text-data font-semibold text-primary">
          {[link.trader.name, link.trader.organization].filter(Boolean).join(' · ')}
        </span>
        <span className="font-sans text-label text-secondary">
          {t('rfq.links.requested', {
            date: format.dayMonth(link.requestedAt),
            time: format.time(link.requestedAt),
            expires: format.dayMonth(link.expiresAt),
          })}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          size="sm"
          variant="success"
          aria-label={`${t('rfq.links.confirm')} · ${link.trader.name}`}
          onClick={onConfirm}
        >
          {t('rfq.links.confirm')}
        </Button>
        <DeclineLinkButton link={link} />
      </div>
    </li>
  )
}

/**
 * The bank's linked traders in a sortable, exportable table of 22 px rows (spec section 8): a
 * trader picked by a click or the arrows gets its two buttons under the table, at the size a
 * target needs (WCAG 2.5.8); Enter or the right-click menu changes its limit.
 */
function LinkedTraders({
  links,
  onChangeLimit,
}: {
  links: TraderLinkDto[]
  onChangeLimit: (link: TraderLinkDto) => void
}) {
  const { t } = useTranslation()
  const format = useFormat()
  const locale = useLocale()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = links.find((link) => link.id === selectedId) ?? null
  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor(
          (link) => [link.trader.name, link.trader.organization].filter(Boolean).join(' · '),
          {
            id: 'trader',
            header: t('rfq.links.columns.trader'),
            meta: { width: 'minmax(160px, 2fr)' },
            cell: ({ getValue }) => <span className="text-primary">{getValue()}</span>,
          },
        ),
        helper.accessor((link) => link.dailyLimit ?? Number.POSITIVE_INFINITY, {
          id: 'limit',
          header: t('rfq.links.columns.limit'),
          meta: { align: 'right', width: 'minmax(96px, 1fr)' },
          cell: ({ row }) => (
            <span className="tabular-nums text-primary">
              {row.original.dailyLimit === null
                ? t('rfq.links.noLimit')
                : t('rfq.links.perDay', {
                    amount: formatDailyLimit(row.original.dailyLimit, locale),
                  })}
            </span>
          ),
        }),
        helper.accessor((link) => link.decidedAt ?? link.requestedAt, {
          id: 'since',
          header: t('rfq.links.columns.since'),
          meta: { align: 'right', width: 'minmax(88px, 0.8fr)' },
          cell: ({ getValue }) => (
            <span className="tabular-nums text-secondary">{format.date(getValue())}</span>
          ),
        }),
      ]),
    [format, locale, t],
  )
  return (
    <section aria-labelledby="linked-traders" className="flex min-h-40 flex-1 flex-col">
      <h3
        id="linked-traders"
        className="px-1 pb-1 font-sans text-label font-semibold tracking-title text-accent-amber uppercase"
      >
        {t('rfq.links.linked')}
      </h3>
      <div className="min-h-0 flex-1">
        <DataTable
          data={links}
          columns={columns}
          getRowId={(link) => link.id}
          selectedRowId={selected?.id ?? null}
          onRowClick={(link) => setSelectedId(link.id)}
          onRowDoubleClick={onChangeLimit}
          exportName="cmarket-trader-links"
          emptyMessage={t('rfq.links.noLinked')}
          rowMenu={(link) => [
            {
              id: 'limit',
              label: t('rfq.links.changeLimit', { name: link.trader.name }),
              onSelect: () => onChangeLimit(link),
            },
          ]}
        />
      </div>
      {selected ? (
        <div className="flex flex-wrap items-center gap-2 border-t px-1 pt-2">
          <span className="mr-auto font-sans text-data text-primary">
            {[selected.trader.name, selected.trader.organization].filter(Boolean).join(' · ')}
          </span>
          <Button size="sm" icon={Pencil} onClick={() => onChangeLimit(selected)}>
            {t('rfq.links.changeLimit', { name: selected.trader.name })}
          </Button>
          <RevokeLinkButton link={selected} />
        </div>
      ) : (
        <p className="px-1 pt-1 font-sans text-label text-secondary">{t('rfq.links.hint')}</p>
      )}
    </section>
  )
}
