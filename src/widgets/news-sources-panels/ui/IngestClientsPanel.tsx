import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import { useIngestClients } from '@/entities/news-source'
import { NewIngestClient, RevokeIngestClient } from '@/features/manage-ingest-clients'
import type { IngestClientDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

/**
 * SRC, the ingestion clients (spec section 10, /admin/ingest-clients): CMarket AI's servers, each
 * its key, its addresses, its items this hour against its quota and in the last 24 hours, its
 * last call; "+ Client" makes one (its secret shown once), Revoke ends one.
 */
export function IngestClientsPanel() {
  const { t } = useTranslation()
  const clients = useIngestClients()
  return (
    <Panel title={t('panels.ingestClients')} code="SRC" options={<NewIngestClient />}>
      <QueryView
        query={clients}
        isEmpty={(list) => list.length === 0}
        emptyMessage={t('ingestClients.none')}
      >
        {(list) => (
          <div className="flex flex-col">
            <p className="border-b px-3 py-2 font-sans text-data text-secondary">
              {t('ingestClients.hint')}
            </p>
            <ul className="flex flex-col">
              {list.map((client, index) => (
                <ClientRow key={client.id} client={client} alternate={index % 2 === 1} />
              ))}
            </ul>
          </div>
        )}
      </QueryView>
    </Panel>
  )
}

function ClientRow({ client, alternate }: { client: IngestClientDto; alternate: boolean }) {
  const { t } = useTranslation()
  const format = useFormat()
  const revoked = client.revokedAt !== null
  return (
    <li
      className={clsx(
        'flex flex-col gap-1 border-b px-3 py-2 font-sans text-data',
        alternate && 'bg-row-alt',
        revoked && 'text-secondary',
      )}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-semibold">{client.name}</span>
        <span className={revoked ? 'text-down' : 'text-up'}>
          {revoked
            ? t('ingestClients.revoked', { date: format.date(client.revokedAt ?? '') })
            : t('ingestClients.active')}
        </span>
        {!revoked && (
          <span className="ml-auto">
            <RevokeIngestClient client={client} />
          </span>
        )}
      </div>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-0.5">
        <dt className="text-secondary">{t('ingestClients.key')}</dt>
        <dd className="font-mono break-all">{client.keyId}</dd>
        <dt className="text-secondary">{t('ingestClients.addresses')}</dt>
        <dd className="font-mono break-all">{client.addresses.join(', ')}</dd>
        <dt className="text-secondary">{t('ingestClients.thisHour')}</dt>
        <dd className="font-mono">
          {t('ingestClients.usage', {
            count: format.number(client.itemsThisHour, 0),
            quota: format.number(client.hourlyQuota, 0),
          })}
        </dd>
        <dt className="text-secondary">{t('ingestClients.today')}</dt>
        <dd className="font-mono">{format.number(client.itemsToday, 0)}</dd>
        <dt className="text-secondary">{t('ingestClients.used')}</dt>
        <dd className="font-mono">
          {client.lastUsedAt
            ? `${format.date(client.lastUsedAt)} ${format.time(client.lastUsedAt)}`
            : t('ingestClients.never')}
        </dd>
      </dl>
    </li>
  )
}
