import { Plus, X } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MAX_SPECIALTIES } from '@/entities/profile'
import type { SpecialtyDto } from '@/shared/api/contracts'
import { useLocale } from '@/shared/i18n'
import { ContextMenu } from '@/shared/ui/ContextMenu'
import { useField } from '@/shared/ui/form/fieldContext'

interface SpecialtyPickerProps {
  specialties: readonly SpecialtyDto[]
  value: string[]
  onChange: (ids: string[]) => void
}

/** Up to 8 specialties of the Admin's list (spec section 15): tags, each removed by its cross. */
export function SpecialtyPicker({ specialties, value, onChange }: SpecialtyPickerProps) {
  const { t } = useTranslation()
  const locale = useLocale()
  const field = useField()
  const addRef = useRef<HTMLButtonElement>(null)
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const close = useCallback(() => setMenu(null), [])
  const nameOf = (id: string) => specialties.find((one) => one.id === id)?.name[locale] ?? id
  const full = value.length >= MAX_SPECIALTIES

  return (
    <div
      role="group"
      aria-labelledby={field?.labelId}
      aria-describedby={field?.describedBy}
      className="flex flex-wrap gap-1.5"
    >
      {value.map((id) => (
        <span
          key={id}
          className="inline-flex h-6 items-center gap-1 border pl-2 font-sans text-data text-info"
        >
          {nameOf(id)}
          <button
            type="button"
            aria-label={t('network.profile.removeSpecialty', { name: nameOf(id) })}
            onClick={() => onChange(value.filter((other) => other !== id))}
            className="flex size-6 items-center justify-center text-secondary hover:text-down"
          >
            <X aria-hidden className="size-3" />
          </button>
        </span>
      ))}
      <button
        ref={addRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={menu !== null}
        disabled={full}
        onClick={(event) => {
          if (menu) return close()
          const rect = event.currentTarget.getBoundingClientRect()
          setMenu({ x: rect.left, y: rect.bottom + 4 })
        }}
        className="inline-flex h-6 items-center gap-1 border px-2 font-sans text-data text-accent-amber hover:bg-panel-header disabled:text-secondary"
      >
        <Plus aria-hidden className="size-3" />
        {full
          ? t('network.profile.specialtiesFull', { max: MAX_SPECIALTIES })
          : t('network.profile.addSpecialty')}
      </button>
      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          ignoreRef={addRef}
          onClose={close}
          items={specialties
            .filter((specialty) => !value.includes(specialty.id))
            .map((specialty) => ({
              id: specialty.id,
              label: specialty.name[locale],
              onSelect: () => onChange([...value, specialty.id]),
            }))}
        />
      )}
    </div>
  )
}
