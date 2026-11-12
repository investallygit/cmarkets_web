import { useTranslation } from 'react-i18next'
import { useSecurityProfile, useStoredDescription } from '@/entities/security'
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
 * as EQS shows it under its results (spec section 9, screen 3; ROADMAP decision 9).
 */
export function DescriptionEditorPanel({ securityId }: DescriptionEditorPanelProps) {
  const { t } = useTranslation()
  const profile = useSecurityProfile(securityId ?? undefined)
  const stored = useStoredDescription(securityId)
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
        <QueryView query={stored}>
          {(data) => (
            <DescriptionForm
              // A new form for each security; a save keeps it, so that its confirmation shows.
              key={data.securityId}
              stored={data}
              code={code}
            />
          )}
        </QueryView>
      )}
    </Panel>
  )
}
