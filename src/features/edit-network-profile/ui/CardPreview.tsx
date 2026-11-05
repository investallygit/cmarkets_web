import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import {
  CONTACT_MODES,
  ContactButton,
  previewContactMode,
  ProfileCard,
  typesByMode,
  type ProfileCardData,
} from '@/entities/profile'
import { CLIENT_ACCOUNT_TYPES, type ClientAccountType } from '@/shared/api/contracts'
import { useLocale } from '@/shared/i18n'
import { Button } from '@/shared/ui/form/Button'
import type { ProfileEditor } from '../model/useProfileEditor'

interface CardPreviewProps {
  editor: ProfileEditor
  viewpoint: ClientAccountType
  onViewpoint: (viewpoint: ClientAccountType) => void
}

/**
 * NET ME, the card as the directory shows it, changes not saved included (spec section 9,
 * screen 12): the button a viewer of each type sees, then SAVE for the three panels.
 */
export function CardPreview({ editor, viewpoint, onViewpoint }: CardPreviewProps) {
  const { t } = useTranslation()
  const locale = useLocale()
  const { form, profile } = editor
  const hidden = form.visibility === 'hidden'
  const card: ProfileCardData = {
    displayName: form.displayName.trim() || profile.displayName,
    accountType: profile.accountType,
    photoUrl: profile.photoUrl,
    jobTitle: form.jobTitle.trim(),
    organization: form.organization.trim(),
    city: form.city.trim(),
    country: form.country,
    specialties: form.specialties.map(
      (id) => editor.specialties.find((one) => one.id === id)?.name[locale] ?? id,
    ),
    stats: form.show.publicationStats ? profile.stats : null,
    memberSince: profile.memberSince,
  }
  const groups = typesByMode(form)

  return (
    <div className="flex min-h-full flex-col gap-4 p-3">
      <div className={clsx('flex flex-col gap-2', hidden && 'opacity-60')}>
        <ProfileCard
          profile={card}
          actions={
            <ContactButton mode={previewContactMode(viewpoint, form)} preview className="w-full" />
          }
        />
      </div>
      {hidden && <p className="font-sans text-data text-warning">{t('network.card.hidden')}</p>}

      <div className="flex flex-col gap-1.5">
        <span className="font-sans text-data text-secondary">{t('network.card.viewpoint')}</span>
        <div className="grid grid-cols-3 gap-1.5">
          {CLIENT_ACCOUNT_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              aria-pressed={viewpoint === type}
              onClick={() => onViewpoint(type)}
              className={clsx(
                'h-7 truncate border px-2 font-sans text-data',
                viewpoint === type
                  ? 'border-accent-amber bg-selected text-primary'
                  : 'text-secondary hover:text-primary',
              )}
            >
              {t(`accountBadge.${type}`)}
            </button>
          ))}
        </div>
        <ul className="flex flex-col gap-0.5 font-sans text-title text-secondary">
          {CONTACT_MODES.filter((mode) => groups[mode].length > 0).map((mode) => (
            <li key={mode}>
              {t(`network.card.summary.${mode}`, {
                types: groups[mode].map((type) => t(`accountBadge.${type}`)).join(', '),
              })}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto flex flex-col gap-1.5">
        {editor.failure && (
          <p role="alert" className="font-sans text-data text-down">
            {editor.failure}
          </p>
        )}
        <Button
          variant="primary"
          size="xl"
          busy={editor.saving}
          disabled={!editor.dirty}
          onClick={editor.save}
          className="w-full"
        >
          {t('network.save')}
        </Button>
      </div>
    </div>
  )
}
