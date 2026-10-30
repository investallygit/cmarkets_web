import { useTranslation } from 'react-i18next'
import { usePublication } from '@/entities/publication'
import { PublicationSettings } from '@/features/edit-publication'
import { Panel } from '@/shared/ui/Panel'
import { PanelEmpty } from '@/shared/ui/StatusViews'
import { QueryView } from '@/shared/ui/QueryView'

/**
 * Screen 7, right: access, prices, rating, disclosures, attachment, then Submit. API PUT
 * /publications/{id}/pricing, POST .../attachments, .../submit, .../versions, .../archive.
 */
export function PublicationSettingsPanel({ publicationId }: { publicationId: string | null }) {
  const { t } = useTranslation()
  const publication = usePublication(publicationId)
  return (
    <Panel title={t('panels.publicationSettings')} code="PUB">
      {publicationId === null ? (
        <PanelEmpty message={t('studio.mine.choose')} />
      ) : (
        <QueryView query={publication}>
          {(data) => <PublicationSettings publication={data} />}
        </QueryView>
      )}
    </Panel>
  )
}
