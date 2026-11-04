import { Hourglass } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMyPublications, usePublication } from '@/entities/publication'
import { useCurrentUser } from '@/entities/session'
import { NewPublicationDialog } from '@/features/create-publication'
import { useDraftAutosave } from '@/features/edit-publication'
import { ScreenWorkspace } from '@/features/workspace-layout'
import { useSearchParamsUpdate, withParams } from '@/shared/routes/useSearchParamsUpdate'
import { EarningsPanel } from '@/widgets/earnings-panel'
import { MyPublicationsPanel } from '@/widgets/my-publications-panel'
import { PublicationEditorPanel } from '@/widgets/publication-editor-panel'
import { PublicationSettingsPanel } from '@/widgets/publication-settings-panel'
import { STUDIO_LAYOUT } from '../config/layout'

/**
 * PUB NEW, the publishing studio (screen 7): the analyst's publications and earnings, the editor
 * and the settings of the one open, saved every 10 seconds. The open publication lives in the
 * URL (?id=); the latest one opens otherwise. An Analyst not approved yet only sees why.
 */
export function PublishingStudioPage() {
  const { verificationStatus } = useCurrentUser()
  return verificationStatus === 'approved' ? (
    <Studio />
  ) : (
    <AwaitingApproval rejected={verificationStatus === 'rejected'} />
  )
}

function Studio() {
  const [params, update] = useSearchParamsUpdate()
  const [creating, setCreating] = useState(false)
  const mine = useMyPublications()
  const selectedId = params.get('id') ?? mine.data?.at(0)?.id ?? null
  useDraftAutosave(usePublication(selectedId).data)
  const select = (id: string) => update((current) => withParams(current, { id }))

  const panels = {
    mine: (
      <MyPublicationsPanel
        selectedId={selectedId}
        onSelect={select}
        onCreate={() => setCreating(true)}
      />
    ),
    earnings: <EarningsPanel />,
    editor: <PublicationEditorPanel publicationId={selectedId} />,
    settings: <PublicationSettingsPanel publicationId={selectedId} />,
  }
  return (
    <>
      <ScreenWorkspace screenId="PUBNEW" defaultLayout={STUDIO_LAYOUT} panels={panels} />
      <NewPublicationDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(publication) => select(publication.id)}
      />
    </>
  )
}

function AwaitingApproval({ rejected }: { rejected: boolean }) {
  const { t } = useTranslation()
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="flex max-w-md flex-col items-center gap-3 border bg-panel p-6 text-center">
        <Hourglass aria-hidden className="size-6 text-accent-amber" />
        <h2 className="font-sans text-figure font-semibold">
          {t(rejected ? 'studio.approval.rejectedTitle' : 'studio.approval.title')}
        </h2>
        <p className="font-sans text-label text-secondary">
          {t(rejected ? 'studio.approval.rejected' : 'studio.approval.waiting')}
        </p>
      </div>
    </div>
  )
}
