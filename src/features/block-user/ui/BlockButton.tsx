import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { conversationKeys } from '@/entities/conversation'
import { useBlockUser } from '@/entities/profile'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Button } from '@/shared/ui/form/Button'
import { toast } from '@/shared/ui/toast'

interface BlockButtonProps {
  userId: string
  displayName: string
  blocked: boolean
  size?: 'md' | 'lg'
  className?: string
}

/**
 * Block, after a confirmation, or unblock (spec section 15): the blocked person no longer sees
 * the profile nor writes, and the conversations close; nobody is told.
 */
export function BlockButton({
  userId,
  displayName,
  blocked,
  size = 'lg',
  className,
}: BlockButtonProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const block = useBlockUser()
  const [confirming, setConfirming] = useState(false)
  const change = (value: boolean) =>
    block.mutate(
      { userId, block: value },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: conversationKeys.all })
          toast.success(
            value
              ? t('messaging.participant.blocked', { name: displayName })
              : t('messaging.participant.unblocked', { name: displayName }),
          )
          setConfirming(false)
        },
        onError: (error) => toast.error(error.message),
      },
    )
  return (
    <>
      <Button
        variant={blocked ? 'secondary' : 'danger'}
        size={size}
        busy={block.isPending && !confirming}
        onClick={() => (blocked ? change(false) : setConfirming(true))}
        className={className}
      >
        {blocked ? t('messaging.participant.unblock') : t('messaging.participant.block')}
      </Button>
      <ConfirmDialog
        open={confirming}
        title={t('messaging.participant.blockTitle', { name: displayName })}
        message={t('messaging.participant.blockMessage', { name: displayName })}
        confirmLabel={t('messaging.participant.block')}
        tone="danger"
        busy={block.isPending}
        onConfirm={() => change(true)}
        onClose={() => setConfirming(false)}
      />
    </>
  )
}
