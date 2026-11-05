import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CardPreview,
  PrivacyFields,
  ProfileFields,
  SaveState,
  type ProfileEditor,
} from '@/features/edit-network-profile'
import type { ClientAccountType } from '@/shared/api/contracts'
import { Panel } from '@/shared/ui/Panel'

interface PanelProps {
  /** The changes the three panels share until SAVE. */
  editor: ProfileEditor
}

/** NET ME, left: the profile the user writes (GET / PUT /me/profile). */
export function MyProfilePanel({ editor }: PanelProps) {
  const { t } = useTranslation()
  return (
    <Panel title={t('panels.myProfile')} code="NET ME" options={<SaveState editor={editor} />}>
      <ProfileFields editor={editor} />
    </Panel>
  )
}

/** NET ME, centre: who sees the profile and who may write (GET / PUT /me/profile/privacy). */
export function VisibilityPanel({ editor }: PanelProps) {
  const { t } = useTranslation()
  return (
    <Panel title={t('panels.visibility')} code="NET ME">
      <PrivacyFields editor={editor} />
    </Panel>
  )
}

/** NET ME, right: the card as a viewer of each type sees it, and SAVE. */
export function CardPreviewPanel({ editor }: PanelProps) {
  const { t } = useTranslation()
  const [viewpoint, setViewpoint] = useState<ClientAccountType>('manager')
  return (
    <Panel
      title={t('panels.cardPreview')}
      code="NET"
      options={<span>{t(`network.card.seenBy.${viewpoint}`)}</span>}
    >
      <CardPreview editor={editor} viewpoint={viewpoint} onViewpoint={setViewpoint} />
    </Panel>
  )
}
