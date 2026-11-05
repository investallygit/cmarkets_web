import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDeleteExperience } from '@/entities/profile'
import type { ExperienceDto } from '@/shared/api/contracts'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Button } from '@/shared/ui/form/Button'
import { toast } from '@/shared/ui/toast'
import { ExperienceDialog } from './ExperienceDialog'

/** Positions held to this day first, then by their end, then the certifications. */
function inOrder(experiences: readonly ExperienceDto[]): ExperienceDto[] {
  const end = (experience: ExperienceDto) => experience.to ?? Number.POSITIVE_INFINITY
  return [...experiences].sort(
    (a, b) =>
      Number(a.kind === 'certification') - Number(b.kind === 'certification') ||
      end(b) - end(a) ||
      (b.from ?? 0) - (a.from ?? 0),
  )
}

/**
 * The experience and certifications of the profile, each saved on its own
 * (POST / PUT / DELETE /me/profile/experiences): "2014 – 2020  Credit analyst, Bank H".
 */
export function ExperienceList({ experiences }: { experiences: readonly ExperienceDto[] }) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState<ExperienceDto | 'new' | null>(null)
  const [deleting, setDeleting] = useState<ExperienceDto | null>(null)
  const remove = useDeleteExperience()

  const period = (experience: ExperienceDto) =>
    experience.kind === 'certification'
      ? t('network.profile.certification')
      : `${experience.from ?? ''} – ${experience.to ?? t('network.profile.now')}`

  return (
    <div className="flex flex-col gap-1.5">
      {experiences.length === 0 ? (
        <p className="font-sans text-data text-secondary">{t('network.profile.noExperience')}</p>
      ) : (
        <ul className="flex flex-col">
          {inOrder(experiences).map((experience) => (
            <li
              key={experience.id}
              className="grid grid-cols-[112px_minmax(0,1fr)_auto] items-center gap-3 py-0.5"
            >
              <span className="font-mono text-data text-secondary">{period(experience)}</span>
              <span className="font-sans text-label">
                {[experience.title, experience.organization].filter(Boolean).join(', ')}
              </span>
              <span className="flex items-center font-sans text-data">
                <Button
                  variant="link"
                  aria-label={t('network.profile.editLabel', { title: experience.title })}
                  onClick={() => setEditing(experience)}
                  className="h-6 px-1"
                >
                  {t('network.profile.edit')}
                </Button>
                <span aria-hidden className="text-info">
                  ·
                </span>
                <Button
                  variant="link"
                  aria-label={t('network.profile.deleteLabel', { title: experience.title })}
                  onClick={() => setDeleting(experience)}
                  className="h-6 px-1"
                >
                  {t('network.profile.delete')}
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={() => setEditing('new')}
        className="inline-flex h-6 items-center gap-1.5 self-start font-sans text-data text-accent-amber hover:underline"
      >
        <Plus aria-hidden className="size-3.5" />
        {t('network.profile.addExperience')}
      </button>
      <ExperienceDialog editing={editing} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={t('network.profile.deleteTitle')}
        message={t('network.profile.deleteMessage', { title: deleting?.title ?? '' })}
        confirmLabel={t('network.profile.delete')}
        tone="danger"
        busy={remove.isPending}
        onConfirm={() =>
          deleting &&
          remove.mutate(deleting.id, {
            onSuccess: () => {
              toast.success(t('network.profile.deleted'))
              setDeleting(null)
            },
          })
        }
      />
    </div>
  )
}
