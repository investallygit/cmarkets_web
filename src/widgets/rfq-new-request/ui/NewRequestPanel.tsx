import { useTranslation } from 'react-i18next'
import { useRfqSetup } from '@/entities/rfq'
import { NewRfqForm } from '@/features/publish-rfq'
import type { RfqRequestDto } from '@/shared/api/contracts'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

interface NewRequestPanelProps {
  /** The security "Request a price (RFQ)" opened the screen with. */
  initialSecurityId?: string | null
  onPublished: (request: RfqRequestDto) => void
}

/** Screen 22's left column, "New request" (spec section 9): the form, on the RFQ's setup. */
export function NewRequestPanel({ initialSecurityId, onPublished }: NewRequestPanelProps) {
  const { t } = useTranslation()
  const setup = useRfqSetup()
  return (
    <Panel title={t('panels.rfqNewRequest')} code="RFQ NEW">
      <QueryView query={setup}>
        {(data) => (
          // A new security from BS starts the form afresh.
          <NewRfqForm
            key={initialSecurityId ?? ''}
            setup={data}
            initialSecurityId={initialSecurityId}
            onPublished={onPublished}
          />
        )}
      </QueryView>
    </Panel>
  )
}
