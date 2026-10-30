import { Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DOCUMENT_TYPES } from '@/entities/document'
import type { DocumentType } from '@/shared/api/contracts'
import { Select } from '@/shared/ui/form/Select'
import { TextInput } from '@/shared/ui/form/TextInput'

/** The search runs once the user stops typing for this long. */
const SEARCH_DELAY_MS = 300

export interface DocumentFilterValues {
  q: string
  type: '' | DocumentType
}

interface DocumentFiltersProps {
  values: DocumentFilterValues
  onChange: (patch: Partial<DocumentFilterValues>) => void
}

/** Full-text search across the documents (spec section 5) and the document type. */
export function DocumentFilters({ values, onChange }: DocumentFiltersProps) {
  const { t } = useTranslation()
  const [text, setText] = useState(values.q)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  return (
    <div className="grid shrink-0 grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-2 border-b p-2">
      <TextInput
        type="search"
        icon={Search}
        value={text}
        onChange={(next) => {
          setText(next)
          window.clearTimeout(timer.current)
          timer.current = window.setTimeout(() => onChange({ q: next.trim() }), SEARCH_DELAY_MS)
        }}
        placeholder={t('documents.search')}
        aria-label={t('documents.search')}
        highlight={Boolean(values.q)}
      />
      <Select
        value={values.type}
        options={[
          { value: '' as const, label: t('documents.allTypes') },
          ...DOCUMENT_TYPES.map((type) => ({ value: type, label: t(`documents.types.${type}`) })),
        ]}
        onChange={(type) => onChange({ type })}
        aria-label={t('documents.type')}
        highlight={Boolean(values.type)}
      />
    </div>
  )
}
