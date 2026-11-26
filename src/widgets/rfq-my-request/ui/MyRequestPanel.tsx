import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  formatFace,
  shortNumber,
  useDescribeCriteria,
  useMyRfqs,
  useRfqRequest,
} from '@/entities/rfq'
import type { RfqRequestDto } from '@/shared/api/contracts'
import type { RfqScope } from '@/shared/api/endpoints'
import { useLocale } from '@/shared/i18n'
import { Field } from '@/shared/ui/form/Field'
import { Select } from '@/shared/ui/form/Select'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { RequestDetail } from './RequestDetail'

interface MyRequestPanelProps {
  /** The trader's requests ("My request"), or its organisation's, read only (its CEO's view). */
  scope: RfqScope
  /** The request shown: the one just published, or one picked; the first open one otherwise. */
  selectedId: string | null
  onSelect: (id: string) => void
  /** The request picked changed: a request by criteria shows its eligible securities beside it. */
  onShown?: (request: Pick<RfqRequestDto, 'id' | 'number' | 'mode'>) => void
}

/**
 * Screen 22's "My request" (spec section 9; API /rfq/mine, /rfq/{id}): the request picked among the
 * day's, its countdown, its answers ranked with the responders' identities and the automatic
 * selection, which the requester confirms or cancels; then its agreements. Its CEO reads the
 * organisation's requests the same way, without acting on them (ROADMAP decision 18).
 */
export function MyRequestPanel({ scope, selectedId, onSelect, onShown }: MyRequestPanelProps) {
  const { t } = useTranslation()
  const locale = useLocale()
  const describe = useDescribeCriteria()
  const list = useMyRfqs(scope)
  const requests = list.data ?? []
  const shownId = requests.some((request) => request.id === selectedId)
    ? selectedId
    : (requests[0]?.id ?? null)
  const detail = useRfqRequest(shownId)
  const request = detail.data
  const organization = scope === 'organization'
  // The request picked or just published, by its id and mode (not each read of it): the first one
  // shown by default leaves "My SVTs" in place.
  const [shownNumber, shownMode] = [request?.number, request?.mode]
  const pickedId = request?.id === selectedId ? selectedId : null
  useEffect(() => {
    if (pickedId && shownNumber && shownMode)
      onShown?.({ id: pickedId, number: shownNumber, mode: shownMode })
  }, [pickedId, shownNumber, shownMode, onShown])

  const title = organization
    ? t('panels.rfqOrganization')
    : request
      ? `${t('panels.rfqMyRequest')} · ${request.number}`
      : t('panels.rfqMyRequest')
  const options =
    request && !organization
      ? [
          request.mode === 'criteria' ? t('rfqCriteria.types.criteria') : null,
          request.anonymous ? t('rfqTrading.myRequest.anonymous') : null,
          request.svt ? t('rfqTrading.myRequest.svt', { name: request.svt.name }) : null,
        ]
          .filter(Boolean)
          .join(' · ')
      : undefined

  return (
    <Panel
      title={title}
      code="RFQ"
      options={options ? <span className="uppercase">{options}</span> : undefined}
    >
      <QueryView query={list}>
        {() =>
          requests.length === 0 ? (
            <p className="p-2 font-sans text-data text-secondary">
              {organization
                ? t('rfqTrading.myRequest.noneOrganization')
                : t('rfqTrading.myRequest.none')}
            </p>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col overflow-auto">
              {(requests.length > 1 || organization) && (
                <div className="shrink-0 px-2 pt-2">
                  <Field label={t('rfqTrading.myRequest.choose')} inline>
                    <Select
                      value={shownId ?? ''}
                      onChange={onSelect}
                      options={requests.map((summary) => ({
                        value: summary.id,
                        label: [
                          shortNumber(summary.number),
                          organization ? summary.requester.name : null,
                          `${t(`rfqTrading.side.${summary.side}`)} ${formatFace(summary.faceAmount, locale)} ${summary.security?.code ?? (summary.criteria ? describe(summary.criteria).short : '')}`,
                          t(`rfqTrading.requestStatus.${summary.status}`),
                        ]
                          .filter(Boolean)
                          .join(' · '),
                      }))}
                    />
                  </Field>
                </div>
              )}
              <QueryView query={detail}>{(shown) => <RequestDetail request={shown} />}</QueryView>
            </div>
          )
        }
      </QueryView>
    </Panel>
  )
}
