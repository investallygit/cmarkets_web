import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRevokeIngestClient } from '@/entities/news-source'
import type { IngestClientDto } from '@/shared/api/contracts'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Button } from '@/shared/ui/form/Button'
import { toast } from '@/shared/ui/toast'

/** Revoke (SRC): the client's next calls are refused (403); its items stay in the feed. */
export function RevokeIngestClient({ client }: { client: IngestClientDto }) {
  const { t } = useTranslation()
  const revoke = useRevokeIngestClient()
  const [asking, setAsking] = useState(false)
  return (
    <>
      <Button
        size="sm"
        variant="danger"
        onClick={() => setAsking(true)}
        aria-label={`${t('ingestClients.revoke')} · ${client.name}`}
      >
        {t('ingestClients.revoke')}
      </Button>
      <ConfirmDialog
        open={asking}
        onClose={() => {
          revoke.reset()
          setAsking(false)
        }}
        title={t('ingestClients.revokeTitle', { name: client.name })}
        message={
          <>
            {t('ingestClients.revokeMessage')}
            {revoke.error && (
              <span role="alert" className="mt-2 block text-down">
                {revoke.error.message}
              </span>
            )}
          </>
        }
        confirmLabel={t('ingestClients.revoke')}
        tone="danger"
        busy={revoke.isPending}
        onConfirm={() =>
          revoke.mutate(client.id, {
            onSuccess: () => {
              toast.success(t('ingestClients.revokedToast', { name: client.name }))
              setAsking(false)
            },
          })
        }
      />
    </>
  )
}
