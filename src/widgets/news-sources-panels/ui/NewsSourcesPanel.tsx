import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { NewsSourceTag } from '@/entities/news'
import { useAdminNewsSources } from '@/entities/news-source'
import { NEWS_CHANNELS, type AdminNewsSourceDto, type NewsChannel } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { PanelTabs } from '@/shared/ui/PanelTabs'
import { QueryView } from '@/shared/ui/QueryView'

const helper = createDataColumnHelper<AdminNewsSourceDto>()
const getId = (source: AdminNewsSourceDto) => source.id

interface NewsSourcesPanelProps {
  channel: NewsChannel | null
  onChannelChange: (channel: NewsChannel | null) => void
  selectedId: string | null
  onSelect: (id: string) => void
}

/**
 * SRC, the newspapers (ROADMAP decision 6): by channel, the partner newspapers first; each its
 * tag, name, review mode, contract (rate per unique click, monthly cap, FLASH items a day), News
 * providers and items of the month. A click opens it beside.
 */
export function NewsSourcesPanel({
  channel,
  onChannelChange,
  selectedId,
  onSelect,
}: NewsSourcesPanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const sources = useAdminNewsSources(channel)

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('shortName', {
          header: t('newsSources.columns.tag'),
          meta: { width: '132px' },
          cell: ({ row }) => <NewsSourceTag source={row.original} mode="none" />,
        }),
        helper.accessor('name', { header: t('newsSources.columns.name'), meta: { width: '2fr' } }),
        helper.accessor((source) => t(`newsSources.moderations.${source.moderation}`), {
          id: 'moderation',
          header: t('newsSources.columns.moderation'),
          meta: { width: '1.4fr' },
        }),
        helper.accessor('ratePerClick', {
          header: t('newsSources.columns.rate'),
          meta: { align: 'right', width: '72px' },
          cell: ({ row, getValue }) =>
            row.original.channel === 'partner' ? format.number(getValue(), 0) : '—',
        }),
        helper.accessor((source) => source.monthlyCap ?? -1, {
          id: 'cap',
          header: t('newsSources.columns.cap'),
          meta: { align: 'right', width: '96px' },
          cell: ({ row }) =>
            row.original.channel !== 'partner'
              ? '—'
              : row.original.monthlyCap === null
                ? t('newsSources.noCap')
                : format.number(row.original.monthlyCap, 0),
        }),
        helper.accessor('flashQuota', {
          header: t('newsSources.columns.quota'),
          meta: { align: 'right', width: '88px' },
          cell: ({ row, getValue }) => (row.original.channel === 'partner' ? getValue() : '—'),
        }),
        helper.accessor('members', {
          header: t('newsSources.columns.members'),
          meta: { align: 'right', width: '80px' },
        }),
        helper.accessor('itemsThisMonth', {
          header: t('newsSources.columns.items'),
          meta: { align: 'right', width: '96px' },
        }),
      ]),
    [t, format],
  )

  return (
    <Panel
      title={t('panels.newsSources')}
      code="SRC"
      options={
        <PanelTabs
          value={channel ?? 'all'}
          options={[
            { value: 'all', label: t('newsSources.channels.all') },
            ...NEWS_CHANNELS.map((value) => ({ value, label: t(`newsSources.channels.${value}`) })),
          ]}
          onChange={(value) => onChannelChange(value === 'all' ? null : value)}
        />
      }
    >
      <QueryView query={sources}>
        {(list) => (
          <DataTable
            data={list}
            columns={columns}
            getRowId={getId}
            selectedRowId={selectedId}
            onRowClick={(source) => onSelect(source.id)}
            exportName="news-sources"
            emptyMessage={t('newsSources.none')}
          />
        )}
      </QueryView>
    </Panel>
  )
}
