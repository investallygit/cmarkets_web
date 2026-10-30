import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useFollowAnalyst } from '@/entities/analyst'
import { libraryKeys } from '@/entities/publication'
import type { AnalystDto } from '@/shared/api/contracts'
import { toast } from '@/shared/ui/toast'

/** "FOLLOW +" in the analyst's title bar: their new publications are notified (spec section 13). */
export function FollowButton({ analyst }: { analyst: AnalystDto }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const follow = useFollowAnalyst(analyst.id)
  if (analyst.isSelf) return null
  return (
    <button
      type="button"
      aria-pressed={analyst.isFollowed}
      disabled={follow.isPending}
      onClick={() =>
        follow.mutate(!analyst.isFollowed, {
          // The Followed analysts tab of the library changes with it.
          onSuccess: () => void queryClient.invalidateQueries({ queryKey: libraryKeys.lists() }),
          onError: (error) => toast.error(error.message),
        })
      }
      className="panel-no-drag uppercase hover:text-primary disabled:opacity-50"
    >
      {analyst.isFollowed ? t('analyst.following') : t('analyst.follow')}
    </button>
  )
}
