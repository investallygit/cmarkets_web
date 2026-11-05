import { useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useAddSpecialty,
  useRemoveSpecialty,
  useRenameSpecialty,
} from '@/entities/platform-settings'
import { profileKeys } from '@/entities/profile'
import { isApiError } from '@/shared/api'
import type { AdminSpecialtyDto, SpecialtyDto } from '@/shared/api/contracts'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { TextInput } from '@/shared/ui/form/TextInput'
import { toast } from '@/shared/ui/toast'

type Name = SpecialtyDto['name']

const LANGUAGES = ['en', 'fr'] as const
const EMPTY: Name = { en: '', fr: '' }

/** The errors of the server by language, from the problem of a 400. */
function nameErrors(error: Error | null): Partial<Record<keyof Name, string>> {
  const errors = isApiError(error, 400) ? (error.problem.errors ?? {}) : {}
  return { en: errors['name.en']?.[0], fr: errors['name.fr']?.[0] }
}

/** The two names of a specialty, each in its field. */
function NameFields({
  name,
  onChange,
  errors,
  prefix,
}: {
  name: Name
  onChange: (name: Name) => void
  errors: Partial<Record<keyof Name, string>>
  /** What the fields are for, before the language: "Name in English", "Rename ...". */
  prefix?: string
}) {
  const { t } = useTranslation()
  return (
    <>
      {LANGUAGES.map((language) => {
        const label = t('specialties.nameIn', { language: t(`specialties.${language}`) })
        return (
          <Field key={language} label={label} error={errors[language]} className="min-w-40 flex-1">
            <TextInput
              value={name[language]}
              onChange={(value) => onChange({ ...name, [language]: value })}
              maxLength={40}
              highlight
              aria-label={prefix ? `${prefix}, ${label}` : undefined}
            />
          </Field>
        )
      })}
    </>
  )
}

/**
 * ADMCFG, the specialties (spec section 15): the closed list the profiles pick theirs from, named
 * in French and English. A specialty that profiles list can be renamed, not removed. NET and
 * NET ME read the list again after each change.
 */
export function SpecialtiesEditor({ specialties }: { specialties: AdminSpecialtyDto[] }) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const add = useAddSpecialty()
  const rename = useRenameSpecialty()
  const remove = useRemoveSpecialty()
  const [adding, setAdding] = useState<Name>(EMPTY)
  const [editing, setEditing] = useState<{ id: string; name: Name } | null>(null)
  const [removing, setRemoving] = useState<AdminSpecialtyDto | null>(null)
  const language = i18n.language.startsWith('fr') ? 'fr' : 'en'
  const changed = () => void queryClient.invalidateQueries({ queryKey: profileKeys.specialties() })

  return (
    <div className="flex h-full flex-col">
      <p className="shrink-0 px-3 pt-3 font-sans text-data text-secondary">
        {t('specialties.hint')}
      </p>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <table className="w-full font-sans text-data">
          <thead>
            <tr className="text-left text-secondary">
              <th scope="col" className="pb-1 font-normal">
                {t('specialties.en')}
              </th>
              <th scope="col" className="pb-1 font-normal">
                {t('specialties.fr')}
              </th>
              <th scope="col" className="pb-1 pr-3 text-right font-normal">
                {t('specialties.used')}
              </th>
              <td className="w-16" />
            </tr>
          </thead>
          <tbody>
            {specialties.map((specialty, index) => {
              const name = specialty.name[language]
              if (editing?.id === specialty.id) {
                return (
                  <tr key={specialty.id}>
                    <td colSpan={4} className="py-2">
                      <form
                        noValidate
                        className="flex flex-wrap items-end gap-2"
                        onSubmit={(event) => {
                          event.preventDefault()
                          rename.mutate(editing, {
                            onSuccess: () => {
                              setEditing(null)
                              changed()
                              toast.success(t('specialties.renamed'))
                            },
                          })
                        }}
                      >
                        <NameFields
                          name={editing.name}
                          onChange={(next) => setEditing({ ...editing, name: next })}
                          errors={nameErrors(rename.error)}
                          prefix={t('specialties.rename', { name })}
                        />
                        <Button type="submit" variant="primary" busy={rename.isPending}>
                          {t('specialties.save')}
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            rename.reset()
                            setEditing(null)
                          }}
                        >
                          {t('specialties.cancel')}
                        </Button>
                      </form>
                    </td>
                  </tr>
                )
              }
              return (
                <tr key={specialty.id} className={index % 2 === 1 ? 'bg-row-alt' : undefined}>
                  <td className="py-1 pr-3">{specialty.name.en}</td>
                  <td className="py-1 pr-3">{specialty.name.fr}</td>
                  <td className="py-1 pr-3 text-right font-mono whitespace-nowrap text-secondary">
                    {specialty.profiles > 0
                      ? t('specialties.profiles', { count: specialty.profiles })
                      : t('specialties.unused')}
                  </td>
                  <td className="py-1">
                    <span className="flex justify-end gap-1">
                      <button
                        type="button"
                        aria-label={t('specialties.rename', { name })}
                        onClick={() => {
                          rename.reset()
                          setEditing({ id: specialty.id, name: { ...specialty.name } })
                        }}
                        className="flex size-6 items-center justify-center text-secondary hover:text-primary"
                      >
                        <Pencil aria-hidden className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={t('specialties.remove', { name })}
                        title={specialty.profiles > 0 ? t('specialties.inUse') : undefined}
                        disabled={specialty.profiles > 0}
                        onClick={() => setRemoving(specialty)}
                        className="flex size-6 items-center justify-center text-secondary hover:text-down disabled:opacity-40 disabled:hover:text-secondary"
                      >
                        <Trash2 aria-hidden className="size-3.5" />
                      </button>
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <form
        noValidate
        className="flex shrink-0 flex-wrap items-end gap-2 border-t px-3 py-2"
        onSubmit={(event) => {
          event.preventDefault()
          add.mutate(
            { name: adding },
            {
              onSuccess: () => {
                setAdding(EMPTY)
                changed()
                toast.success(t('specialties.added'))
              },
            },
          )
        }}
      >
        <NameFields
          name={adding}
          onChange={setAdding}
          errors={nameErrors(add.error)}
          prefix={t('specialties.addTitle')}
        />
        <Button type="submit" variant="primary" icon={Plus} busy={add.isPending}>
          {t('specialties.add')}
        </Button>
      </form>
      {removing && (
        <ConfirmDialog
          open
          title={t('specialties.removeTitle', { name: removing.name[language] })}
          message={t('specialties.removeMessage')}
          confirmLabel={t('specialties.remove', { name: removing.name[language] })}
          tone="danger"
          busy={remove.isPending}
          onConfirm={() =>
            remove.mutate(removing.id, {
              onSuccess: () => {
                setRemoving(null)
                changed()
                toast.success(t('specialties.removed'))
              },
              onError: (error) => toast.error(error.message),
            })
          }
          onClose={() => setRemoving(null)}
        />
      )}
    </div>
  )
}
