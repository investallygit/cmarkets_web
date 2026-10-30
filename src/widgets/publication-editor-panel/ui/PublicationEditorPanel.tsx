import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePublication } from '@/entities/publication'
import { PublicationEditor, ReaderPreviewDialog, SaveStatus } from '@/features/edit-publication'
import { Panel } from '@/shared/ui/Panel'
import { PanelEmpty } from '@/shared/ui/StatusViews'
import { QueryView } from '@/shared/ui/QueryView'

/**
 * Screen 7, centre: the editor of the publication open, with the time of the last autosave and
 * the reader preview in the title bar. API GET / PUT /publications/{id}.
 */
export function PublicationEditorPanel({ publicationId }: { publicationId: string | null }) {
  const { t } = useTranslation()
  const publication = usePublication(publicationId)
  const [previewing, setPreviewing] = useState(false)

  return (
    <Panel
      title={t('panels.editor')}
      code="PUB"
      options={
        publication.data && (
          <>
            <SaveStatus />
            <span aria-hidden>·</span>
            <button
              type="button"
              onClick={() => setPreviewing(true)}
              className="panel-no-drag uppercase hover:text-primary"
            >
              {t('studio.preview.open')}
            </button>
          </>
        )
      }
    >
      {publicationId === null ? (
        <PanelEmpty message={t('studio.mine.choose')} />
      ) : (
        <QueryView query={publication}>
          {(data) => (
            <>
              <PublicationEditor publication={data} />
              <ReaderPreviewDialog
                open={previewing}
                onClose={() => setPreviewing(false)}
                publication={data}
              />
            </>
          )}
        </QueryView>
      )}
    </Panel>
  )
}
