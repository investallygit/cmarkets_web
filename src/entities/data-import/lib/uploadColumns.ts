import type { ImportColumnDto, ImportDto, ImportTypeDto } from '@/shared/api/contracts'
import { RETIRED_IMPORT_COLUMNS } from '../config/importTypes'

/**
 * The template's columns found in an upload's file, in the template's order. A retired file's
 * template is no longer listed by the API and comes from RETIRED_IMPORT_COLUMNS; a file no template
 * describes is read as text. Either way its rows show: an upload of the "Curves and rates" the
 * CEMAC sovereign yields replaced waited for ever for its template (found on the live site).
 */
export function uploadColumns(
  upload: Pick<ImportDto, 'type' | 'columns'>,
  types: readonly ImportTypeDto[],
): ImportColumnDto[] {
  const template =
    types.find((candidate) => candidate.type === upload.type)?.columns ??
    RETIRED_IMPORT_COLUMNS[upload.type] ??
    upload.columns.map((name): ImportColumnDto => ({ name, kind: 'text', required: false }))
  return template.filter((column) => upload.columns.includes(column.name))
}
