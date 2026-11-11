import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useBondRatings } from '@/entities/bond'
import type { RatingHistoryItemDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { DASH } from '../lib/words'

const helper = createDataColumnHelper<RatingHistoryItemDto>()

/** The words of a rating action, coloured: an upgrade green, a downgrade red. */
const ACTION_CLASS: Record<RatingHistoryItemDto['action'], string | undefined> = {
  new: undefined,
  upgrade: 'text-up',
  downgrade: 'text-down',
  affirmed: 'text-secondary',
}

/**
 * Screen 20, RAT tab: every rating the agencies gave the bond, the latest first, with the one it
 * replaced and what it did. API /bonds/{id}/ratings.
 */
export function RatingHistoryPanel({ bondId }: { bondId: string }) {
  const { t } = useTranslation()
  const format = useFormat()
  const ratings = useBondRatings(bondId)

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('ratedOn', {
          header: t('bondProfile.ratingColumns.date'),
          cell: ({ getValue }) => format.isoDate(getValue()),
        }),
        helper.accessor('agency', {
          header: t('bondProfile.ratingColumns.agency'),
          cell: ({ getValue }) => t(`bondProfile.ratings.agencies.${getValue()}`),
        }),
        helper.accessor('rating', { header: t('bondProfile.ratingColumns.rating') }),
        helper.accessor('previous', {
          header: t('bondProfile.ratingColumns.previous'),
          cell: ({ getValue }) => getValue() ?? DASH,
        }),
        helper.accessor('action', {
          header: t('bondProfile.ratingColumns.action'),
          cell: ({ getValue }) => (
            <span className={ACTION_CLASS[getValue()]}>
              {t(`bondProfile.ratings.actions.${getValue()}`)}
            </span>
          ),
        }),
      ]),
    [t, format],
  )

  return (
    <Panel title={t('panels.ratingHistory')} code="RAT">
      <QueryView
        query={ratings}
        isEmpty={(data) => data.history.length === 0}
        emptyMessage={t('bondProfile.ratings.none')}
      >
        {(data) => (
          <DataTable
            data={data.history}
            columns={columns}
            getRowId={(item) => `${item.agency}-${item.ratedOn}`}
            exportName={`ratings-${bondId}`}
          />
        )}
      </QueryView>
    </Panel>
  )
}
