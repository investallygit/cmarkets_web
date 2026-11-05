import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { ContactButton, ProfileCard } from '@/entities/profile'
import type { DirectoryEntryDto } from '@/shared/api/contracts'
import { messagesPath, routes } from '@/shared/routes/paths'
import { Button, ButtonLink } from '@/shared/ui/form/Button'

interface DirectoryCardProps {
  entry: DirectoryEntryDto
  /** The specialties' names, in the user's language. */
  specialties: string[]
  selected: boolean
  /** The user's own card: Edit my profile, in place of a contact. */
  own: boolean
  onSelect: () => void
}

/**
 * A card of the results (screen 10): the button the profile's rules give the user, amber
 * "Contact", "Send a contact request" or a greyed "Contact not open", and View profile.
 */
export function DirectoryCard({ entry, specialties, selected, own, onSelect }: DirectoryCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (
    <ProfileCard
      selected={selected}
      className="h-full"
      profile={{ ...entry, specialties }}
      actions={
        <div className="mt-auto grid grid-cols-2 gap-2">
          {own ? (
            <ButtonLink to={routes.networkProfile} variant="secondary" size="lg">
              {t('network.directory.editMine')}
            </ButtonLink>
          ) : (
            <ContactButton
              mode={entry.contactMode}
              // MSG opens the conversation with the person, or the one already open.
              onContact={() => void navigate(messagesPath({ to: entry.userId }))}
              className="w-full"
            />
          )}
          <Button
            size="lg"
            aria-label={t('network.directory.viewProfileOf', { name: entry.displayName })}
            aria-current={selected || undefined}
            onClick={onSelect}
          >
            {t('network.directory.viewProfile')}
          </Button>
        </div>
      }
    />
  )
}
