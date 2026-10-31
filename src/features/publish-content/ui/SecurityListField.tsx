import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SecurityPicker } from '@/entities/security'

/** The securities a news item or a document concerns: chips, and a picker to add one. */
export function SecurityListField({
  value,
  onChange,
}: {
  value: readonly string[]
  onChange: (securityIds: string[]) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="grid gap-1.5">
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((id) => (
            <li
              key={id}
              className="inline-flex h-6 items-center gap-1 border border-accent-amber/50 pr-1 pl-2 font-mono text-data text-accent-amber"
            >
              {id}
              <button
                type="button"
                aria-label={t('content.removeSecurity', { code: id })}
                className="text-secondary hover:text-primary"
                onClick={() => onChange(value.filter((candidate) => candidate !== id))}
              >
                <X aria-hidden className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <SecurityPicker
        onSelect={(security) => onChange([...value, security.id])}
        exclude={new Set(value)}
        placeholder={t('content.addSecurity')}
        aria-label={t('content.addSecurity')}
      />
    </div>
  )
}
