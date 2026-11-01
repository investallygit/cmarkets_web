import { http, HttpResponse } from 'msw'
import type { MeUpdateDto, PasswordChangeDto, ScreenLayoutDto } from '@/shared/api/contracts'
import { isTimeZone } from '@/shared/lib/format'
import {
  currentAccount,
  currentUser,
  readLayout,
  revokeSessions,
  saveAccounts,
  writeLayout,
  type StoredLayout,
} from '../db'
import { hashPassword, passwordErrors, randomToken } from '../lib/auth'
import { api, latency, noContent, problem } from '../lib/http'
import { layoutError } from '../lib/layouts'
import { settleDue } from '../payments'

const NAME_MAX = 80
export const sessionHandlers = [
  http.get(api('/me'), async () => {
    await latency()
    // A plan paid while the payer stopped asking applies all the same.
    settleDue(currentAccount().id)
    return HttpResponse.json(currentUser())
  }),

  http.put(api('/me'), async ({ request }) => {
    await latency()
    const body = (await request.json()) as Partial<MeUpdateDto>
    const displayName = String(body.displayName ?? '').trim()
    const phone = String(body.phone ?? '').trim() || null
    const timeZone = String(body.timeZone ?? '')
    const errors: Record<string, string[]> = {}
    if (!displayName) errors.displayName = ['Give your name.']
    else if (displayName.length > NAME_MAX) errors.displayName = [`At most ${NAME_MAX} characters.`]
    if (phone && !/^\d{8,15}$/.test(phone.replace(/[\s.+-]/g, ''))) {
      errors.phone = ['A phone number, e.g. +237 6 70 12 34 56.']
    }
    if (body.language !== 'fr' && body.language !== 'en') errors.language = ['French or English.']
    if (!isTimeZone(timeZone)) errors.timeZone = ['A time zone such as Africa/Douala.']
    if (body.twoFactorChannel !== 'email' && body.twoFactorChannel !== 'sms') {
      errors.twoFactorChannel = ['By e-mail or SMS.']
    } else if (body.twoFactorChannel === 'sms' && !phone) {
      errors.twoFactorChannel = ['Codes by SMS need a phone number.']
    }
    if (Object.keys(errors).length > 0) return problem(400, 'Invalid profile', undefined, errors)
    const account = currentAccount()
    Object.assign(account, {
      displayName,
      phone,
      language: body.language,
      timeZone,
      twoFactorChannel: body.twoFactorChannel,
    })
    saveAccounts()
    return HttpResponse.json(currentUser())
  }),

  http.put(api('/me/password'), async ({ request }) => {
    await latency()
    const body = (await request.json()) as Partial<PasswordChangeDto>
    const account = currentAccount()
    const current = await hashPassword(account.salt, String(body.currentPassword ?? ''))
    if (current !== account.passwordHash) {
      return problem(400, 'Wrong password', undefined, { currentPassword: ['Wrong password.'] })
    }
    const newPassword = String(body.newPassword ?? '')
    const errors = passwordErrors(newPassword)
    if (newPassword === body.currentPassword)
      errors.push('Choose a password you do not use already.')
    if (errors.length > 0)
      return problem(400, 'Invalid password', undefined, { newPassword: errors })
    account.salt = randomToken(8)
    account.passwordHash = await hashPassword(account.salt, newPassword)
    saveAccounts()
    // Other devices log in again; this session stays open.
    revokeSessions(account.id, { keepCurrent: true })
    return noContent()
  }),

  // Nothing saved yet: no positions, so the screen uses its default layout.
  // (The client also accepts a 404 for this case.)
  http.get(api('/me/layouts/:screen'), async ({ params }) => {
    await latency()
    const screen = String(params.screen)
    return HttpResponse.json<ScreenLayoutDto>({ screen, items: [], ...readLayout(screen) })
  }),

  http.put(api('/me/layouts/:screen'), async ({ params, request }) => {
    const body = (await request.json()) as Partial<StoredLayout>
    const error = layoutError(body)
    if (error) return problem(400, 'Invalid layout', error)
    const { items, hidden, stacked, locked, saved } = body as StoredLayout
    writeLayout(String(params.screen), {
      items,
      hidden,
      stacked,
      locked,
      saved: saved?.map((layout) => ({
        name: layout.name.trim(),
        items: layout.items,
        hidden: layout.hidden,
        stacked: layout.stacked,
      })),
    })
    return noContent()
  }),
]
