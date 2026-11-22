import { useTranslation } from 'react-i18next'
import { useCommodity, useCommodityRelated } from '@/entities/commodity'
import { useDescriptionVersions, useSecurityProfile } from '@/entities/security'
import { CommodityForm } from '@/features/describe-commodity'
import { DescriptionForm } from '@/features/describe-security'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { PanelEmpty } from '@/shared/ui/StatusViews'

interface DescriptionEditorPanelProps {
  /** The security CORR works on (?security=). */
  securityId: string | null
}

/**
 * CORR: the description of the security picked for the price correction, in French and English,
 * as DES and EQS show it (spec section 9, screens 2 and 3; ROADMAP decisions 9 and 40), with its
 * versions; on a commodity, its names, texts, CEMAC countries and related securities (screen 21).
 */
export function DescriptionEditorPanel({ securityId }: DescriptionEditorPanelProps) {
  const profile = useSecurityProfile(securityId ?? undefined)
  if (securityId && profile.data?.type === 'commodity') return <CommodityEditor code={securityId} />
  return <SecurityDescriptionEditor securityId={securityId} />
}

/** A commodity's names and links beside its texts (PUT /data/commodities/{code}). */
function CommodityEditor({ code }: { code: string }) {
  const { t } = useTranslation()
  const commodity = useCommodity(code)
  const related = useCommodityRelated(code)
  return (
    <Panel title={t('corrections.description.title', { code })} code="CORR">
      <QueryView query={commodity}>
        {(profile) => (
          <QueryView query={related}>
            {(links) => <CommodityForm key={profile.code} profile={profile} related={links} />}
          </QueryView>
        )}
      </QueryView>
    </Panel>
  )
}

function SecurityDescriptionEditor({ securityId }: DescriptionEditorPanelProps) {
  const { t } = useTranslation()
  const profile = useSecurityProfile(securityId ?? undefined)
  const versions = useDescriptionVersions('security', securityId)
  const code = profile.data?.code ?? securityId ?? ''

  return (
    <Panel
      title={
        securityId ? t('corrections.description.title', { code }) : t('panels.descriptionEditor')
      }
      code="CORR"
    >
      {!securityId ? (
        <PanelEmpty message={t('corrections.description.pick')} />
      ) : (
        <QueryView query={versions}>
          {(data) => (
            <DescriptionForm
              // A new form for each security; a save keeps it, so that its confirmation shows.
              key={data.objectId}
              versions={data}
              code={code}
            />
          )}
        </QueryView>
      )}
    </Panel>
  )
}
