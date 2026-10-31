import { useTranslation } from 'react-i18next'
import { usePatchImportRow } from '@/entities/data-import'
import type { ImportDto, ImportRowDto } from '@/shared/api/contracts'
import { Checkbox } from '@/shared/ui/form/Checkbox'

/**
 * "Alert checked" (spec section 9, screen 6): the Data admin compared the value with its source;
 * stored on the row (PATCH /data/imports/{id}/rows/{rowId}).
 */
export function AlertCheckedBox({
  upload,
  row,
  editable,
}: {
  upload: ImportDto
  row: ImportRowDto | null
  editable: boolean
}) {
  const { t } = useTranslation()
  const patch = usePatchImportRow(upload.id)
  const isAlert = row?.status === 'alert'
  return (
    <span className="inline-flex items-center gap-3">
      <Checkbox
        checked={isAlert && row.checked}
        disabled={!isAlert || !editable || patch.isPending}
        highlight={isAlert && !row.checked}
        onChange={(checked) => row && patch.mutate({ rowId: row.id, patch: { checked } })}
        label={t('dataImport.alertChecked')}
      />
      {patch.error && (
        <span role="alert" className="font-sans text-data text-down">
          {patch.error.message}
        </span>
      )}
    </span>
  )
}
