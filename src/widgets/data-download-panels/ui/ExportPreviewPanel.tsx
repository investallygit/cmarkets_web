import type { UseQueryResult } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ExportCell, ExportPreviewDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { ChangeText } from '@/shared/ui/ChangeText'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { decimalsOf, isExportField } from '../lib/fields'

type PreviewRow = { id: string; cells: ExportCell[] }

const helper = createDataColumnHelper<PreviewRow>()

interface ExportPreviewPanelProps {
  preview: UseQueryResult<ExportPreviewDto> | null
}

/**
 * DL's "Preview" (spec section 9, screen 30): the first 10 rows of the file's first item, newest
 * first, in the fields chosen; for the prices, BVMAC's sessions without trades have no row.
 */
export function ExportPreviewPanel({ preview }: ExportPreviewPanelProps) {
  const { t } = useTranslation()
  const data = preview?.data
  return (
    <Panel
      title={
        data?.code ? t('downloads.previewTitle', { code: data.code }) : t('panels.exportPreview')
      }
      code="DL"
      options={<span>{t('downloads.firstRows')}</span>}
      bodyClassName="flex flex-col"
    >
      {preview === null ? (
        <p className="p-3 font-sans text-data text-secondary">{t('downloads.previewEmpty')}</p>
      ) : (
        <QueryView query={preview}>{(loaded) => <PreviewTable preview={loaded} />}</QueryView>
      )}
    </Panel>
  )
}

function PreviewTable({ preview }: { preview: ExportPreviewDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const columns = useMemo(
    () =>
      helper.columns(
        preview.fields.map((field, index) =>
          helper.accessor((row) => row.cells[index], {
            id: field,
            header: isExportField(field) ? t(`downloads.fields.${field}`) : field,
            meta: { align: field === 'date' ? 'left' : 'right' },
            cell: ({ getValue }) => {
              const value = getValue()
              if (value === null || value === undefined) return '—'
              if (typeof value === 'string') return field === 'date' ? format.isoDate(value) : value
              if (field === 'changePct') return <ChangeText value={value} percent />
              return format.number(value, decimalsOf(field))
            },
          }),
        ),
      ),
    [preview.fields, t, format],
  )
  const rows = useMemo(
    () => preview.rows.map((cells, index) => ({ id: `${index}`, cells })),
    [preview.rows],
  )
  return (
    <>
      <div className="min-h-0 flex-1">
        <DataTable data={rows} columns={columns} getRowId={(row) => row.id} enableSorting={false} />
      </div>
      {preview.dataset === 'prices' && (
        <p className="shrink-0 border-t px-2 py-1.5 font-sans text-caption text-secondary">
          {t('downloads.previewNote')}
        </p>
      )}
    </>
  )
}
