import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useMyPrivacy,
  useMyProfile,
  useSpecialties,
  useUpdateMyPrivacy,
  useUpdateMyProfile,
} from '@/entities/profile'
import { sessionKeys } from '@/entities/session'
import { isApiError } from '@/shared/api'
import type { MyProfileDto, ProfilePrivacyDto, SpecialtyDto } from '@/shared/api/contracts'
import { toast } from '@/shared/ui/toast'
import {
  changesOf,
  formFieldOf,
  hasErrors,
  initialProfileForm,
  toPrivacy,
  toProfileUpdate,
  validateProfileForm,
  type ProfileFormErrors,
  type ProfileFormState,
} from './profileForm'

/** NET ME's state, which its three panels share: what the user changed, until saved. */
export interface ProfileEditor {
  profile: MyProfileDto
  privacy: ProfilePrivacyDto
  specialties: SpecialtyDto[]
  form: ProfileFormState
  set: (patch: Partial<ProfileFormState>) => void
  /** The form's errors once a save was tried, then the server's by field. */
  errors: ProfileFormErrors
  serverErrors: Partial<Record<keyof ProfileFormState, string>>
  /** A refusal that is not about one field. */
  failure: string | null
  dirty: boolean
  saving: boolean
  save: () => void
}

/**
 * The profile, its privacy and the specialties, then the user's changes over them. SAVE sends
 * those of the two that changed; the display name is the account's, so /me is read again.
 */
export function useProfileEditor() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const profile = useMyProfile()
  const privacy = useMyPrivacy()
  const specialties = useSpecialties()
  const updateProfile = useUpdateMyProfile()
  const updatePrivacy = useUpdateMyPrivacy()
  const [edits, setEdits] = useState<Partial<ProfileFormState>>({})
  const [submitted, setSubmitted] = useState(false)

  const queries = [profile, privacy, specialties]
  const retry = () =>
    queries.filter((query) => query.isError).forEach((query) => void query.refetch())
  if (!profile.data || !privacy.data || !specialties.data) {
    return { editor: null, error: queries.find((query) => query.error)?.error ?? null, retry }
  }

  const saved = { profile: profile.data, privacy: privacy.data }
  const form: ProfileFormState = { ...initialProfileForm(saved.profile, saved.privacy), ...edits }
  const changes = changesOf(form, saved)
  const serverErrors: ProfileEditor['serverErrors'] = {}
  let failure: string | null = null
  for (const mutation of [updateProfile, updatePrivacy]) {
    if (!mutation.error) continue
    const byField = isApiError(mutation.error, 400) ? (mutation.error.problem.errors ?? {}) : {}
    for (const [field, messages] of Object.entries(byField)) {
      const key = formFieldOf(field)
      if (key) serverErrors[key] ??= messages[0]
    }
    if (Object.keys(byField).length === 0) failure = mutation.error.message
  }

  const save = async () => {
    setSubmitted(true)
    if (hasErrors(validateProfileForm(form))) return
    try {
      if (changes.profile) await updateProfile.mutateAsync(toProfileUpdate(form))
      if (changes.privacy) await updatePrivacy.mutateAsync(toPrivacy(form))
    } catch {
      return
    }
    setEdits({})
    setSubmitted(false)
    if (changes.profile) void queryClient.invalidateQueries({ queryKey: sessionKeys.me })
    toast.success(t('network.saved'))
  }

  const editor: ProfileEditor = {
    profile: saved.profile,
    privacy: saved.privacy,
    specialties: specialties.data,
    form,
    set: (patch) => {
      updateProfile.reset()
      updatePrivacy.reset()
      setEdits((current) => ({ ...current, ...patch }))
    },
    errors: submitted ? validateProfileForm(form) : {},
    serverErrors,
    failure,
    dirty: changes.profile || changes.privacy,
    saving: updateProfile.isPending || updatePrivacy.isPending,
    save: () => void save(),
  }
  return { editor, error: null, retry }
}
