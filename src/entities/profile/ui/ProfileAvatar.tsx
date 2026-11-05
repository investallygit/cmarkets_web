import { clsx } from 'clsx'
import type { AccountType } from '@/shared/api/contracts'
import { ACCOUNT_TYPE_COLORS } from '@/shared/config/accountTypes'
import { initialsOf } from '../lib/profile'

const SIZES = {
  sm: 'size-10 border-2 text-label',
  md: 'size-12 border-2 text-figure',
  lg: 'size-20 border-[3px] text-[28px]',
} as const

interface ProfileAvatarProps {
  name: string
  type: AccountType
  photoUrl: string | null
  size?: keyof typeof SIZES
}

/**
 * A round photo, or the initials on a dark background when there is none (spec section 15),
 * circled in the colour of the type. The name always shows beside it: the avatar is decorative.
 */
export function ProfileAvatar({ name, type, photoUrl, size = 'md' }: ProfileAvatarProps) {
  const color = ACCOUNT_TYPE_COLORS[type]
  return (
    <span
      aria-hidden
      className={clsx(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-app font-sans font-semibold',
        SIZES[size],
      )}
      style={{ borderColor: color, color }}
    >
      {photoUrl ? (
        <img src={photoUrl} alt="" className="size-full object-cover" />
      ) : (
        initialsOf(name)
      )}
    </span>
  )
}
