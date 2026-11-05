import { http, HttpResponse } from 'msw'
import type {
  ExperienceDto,
  ExperienceInputDto,
  MyProfileUpdateDto,
  Permission,
  ProfilePrivacyDto,
} from '@/shared/api/contracts'
import {
  currentAccount,
  currentUser,
  myProfileDto,
  profileOf,
  saveAccounts,
  saveProfile,
} from '../db'
import { SPECIALTIES } from '../fixtures/network'
import { api, latency, noContent, problem } from '../lib/http'
import { newId } from '../lib/ids'
import { EXPERIENCES_MAX, readExperience, readPrivacy, readProfile } from '../lib/profile'

/** NET ME (screen 12): the user's professional profile, its photo, experiences and privacy. */

const PHOTO_MAX_BYTES = 2 * 1024 * 1024
const PHOTO_TYPES = ['image/jpeg', 'image/png']
/** Side of the square the photo is cropped to, in pixels. */
const PHOTO_SIZE = 400

const allowed = (permission: Permission) => currentUser().permissions.includes(permission)
const forbidden = () =>
  problem(403, 'Forbidden', 'Your account type is not listed in the directory.')
const invalid = (title: string, errors: Record<string, string[]>) =>
  problem(400, title, undefined, errors)

/** The current user's profile, about to change; null if the type has none. */
function editableProfile() {
  return allowed('directory:profile') ? profileOf(currentAccount()) : null
}

/** The photo's centre, cropped square and scaled down, as the server would keep it. */
async function squarePhoto(file: File): Promise<string> {
  const image = await createImageBitmap(file)
  const side = Math.min(image.width, image.height)
  const size = Math.min(side, PHOTO_SIZE)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  canvas
    .getContext('2d')
    ?.drawImage(
      image,
      (image.width - side) / 2,
      (image.height - side) / 2,
      side,
      side,
      0,
      0,
      size,
      size,
    )
  image.close()
  return canvas.toDataURL('image/jpeg', 0.85)
}

export const networkHandlers = [
  // The closed list of specialties the Admin manages; the prototype's endpoint.
  http.get(api('/directory/specialties'), async () => {
    await latency()
    if (!allowed('directory:profile') && !allowed('directory:list')) return forbidden()
    return HttpResponse.json(SPECIALTIES)
  }),

  http.get(api('/me/profile'), async () => {
    await latency()
    if (!allowed('directory:profile')) return forbidden()
    return HttpResponse.json(myProfileDto(currentAccount()))
  }),

  // The display name is the account's: CFG shows the change too.
  http.put(api('/me/profile'), async ({ request }) => {
    await latency()
    const profile = editableProfile()
    if (!profile) return forbidden()
    const body = (await request.json()) as Partial<MyProfileUpdateDto>
    const ids = new Set(SPECIALTIES.map((specialty) => specialty.id))
    const { errors, profile: input } = readProfile(body, ids)
    if (Object.keys(errors).length > 0) return invalid('Invalid profile', errors)
    const { displayName, ...fields } = input
    const account = currentAccount()
    account.displayName = displayName
    saveAccounts()
    saveProfile({ ...profile, ...fields, updatedAt: new Date().toISOString() })
    return HttpResponse.json(myProfileDto(account))
  }),

  http.post(api('/me/profile/photo'), async ({ request }) => {
    await latency()
    const profile = editableProfile()
    if (!profile) return forbidden()
    const file = (await request.formData()).get('photo')
    if (!(file instanceof File) || !PHOTO_TYPES.includes(file.type)) {
      return invalid('Invalid photo', { photo: ['A JPEG or PNG image.'] })
    }
    if (file.size > PHOTO_MAX_BYTES) {
      return invalid('Invalid photo', { photo: ['2 MB at most.'] })
    }
    let photo: string
    try {
      photo = await squarePhoto(file)
    } catch {
      return invalid('Invalid photo', { photo: ['The image cannot be read.'] })
    }
    saveProfile({ ...profile, photo })
    return HttpResponse.json(myProfileDto(currentAccount()))
  }),

  http.post(api('/me/profile/experiences'), async ({ request }) => {
    await latency()
    const profile = editableProfile()
    if (!profile) return forbidden()
    const body = (await request.json()) as Partial<ExperienceInputDto>
    const { errors, experience } = readExperience(body, new Date().getFullYear())
    if (Object.keys(errors).length > 0) return invalid('Invalid experience', errors)
    if (profile.experiences.length >= EXPERIENCES_MAX) {
      return problem(409, 'Too many entries', `${EXPERIENCES_MAX} experiences at most.`)
    }
    const created: ExperienceDto = { id: newId('experience'), ...experience }
    saveProfile({ ...profile, experiences: [...profile.experiences, created] })
    return HttpResponse.json(created, { status: 201 })
  }),

  http.put(api('/me/profile/experiences/:id'), async ({ params, request }) => {
    await latency()
    const profile = editableProfile()
    if (!profile) return forbidden()
    if (!profile.experiences.some((candidate) => candidate.id === params.id)) {
      return problem(404, 'Experience not found')
    }
    const body = (await request.json()) as Partial<ExperienceInputDto>
    const { errors, experience } = readExperience(body, new Date().getFullYear())
    if (Object.keys(errors).length > 0) return invalid('Invalid experience', errors)
    const updated: ExperienceDto = { id: String(params.id), ...experience }
    saveProfile({
      ...profile,
      experiences: profile.experiences.map((candidate) =>
        candidate.id === updated.id ? updated : candidate,
      ),
    })
    return HttpResponse.json(updated)
  }),

  http.delete(api('/me/profile/experiences/:id'), async ({ params }) => {
    await latency()
    const profile = editableProfile()
    if (!profile) return forbidden()
    if (!profile.experiences.some((candidate) => candidate.id === params.id)) {
      return problem(404, 'Experience not found')
    }
    saveProfile({
      ...profile,
      experiences: profile.experiences.filter((candidate) => candidate.id !== params.id),
    })
    return noContent()
  }),

  http.get(api('/me/profile/privacy'), async () => {
    await latency()
    const profile = editableProfile()
    if (!profile) return forbidden()
    return HttpResponse.json(profile.privacy)
  }),

  http.put(api('/me/profile/privacy'), async ({ request }) => {
    await latency()
    const profile = editableProfile()
    if (!profile) return forbidden()
    const body = (await request.json()) as Partial<ProfilePrivacyDto>
    const { errors, privacy } = readPrivacy(body)
    if (Object.keys(errors).length > 0) return invalid('Invalid privacy settings', errors)
    saveProfile({ ...profile, privacy })
    return HttpResponse.json(privacy)
  }),
]
