import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useFollowAnalyst } from '@/entities/analyst'
import { profileKeys } from '@/entities/profile'
import { libraryKeys } from '@/entities/publication'
import type { AnalystDto } from '@/shared/api/contracts'
import { Button } from '@/shared/ui/form/Button'
import { toast } from '@/shared/ui/toast'

interface FollowButtonProps {
  analyst: AnalystDto
  /** "FOLLOW +" in the analyst's title bar (PUB), or a button of its own (a profile of NET). */
  variant?: 'bar' | 'button'
  className?: string
}

/** Follows an analyst: their new publications are notified (spec section 13). */
export function FollowButton({ analyst, variant = 'bar', className }: FollowButtonProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const follow = useFollowAnalyst(analyst.id)
  if (analyst.isSelf) return null
  const toggle = () =>
    follow.mutate(!analyst.isFollowed, {
      onSuccess: () => {
        // The Followed analysts tab of the library changes with it, and the directory's figures.
        void queryClient.invalidateQueries({ queryKey: libraryKeys.lists() })
        void queryClient.invalidateQueries({ queryKey: profileKeys.listed() })
      },
      onError: (error) => toast.error(error.message),
    })

  if (variant === 'button') {
    return (
      <Button
        size="lg"
        aria-pressed={analyst.isFollowed}
        busy={follow.isPending}
        onClick={toggle}
        className={className}
      >
        {analyst.isFollowed ? t('network.view.following') : t('network.view.follow')}
      </Button>
    )
  }
  return (
    <button
      type="button"
      aria-pressed={analyst.isFollowed}
      disabled={follow.isPending}
      onClick={toggle}
      className="panel-no-drag uppercase hover:text-primary disabled:opacity-50"
    >
      {analyst.isFollowed ? t('analyst.following') : t('analyst.follow')}
    </button>
  )
}
