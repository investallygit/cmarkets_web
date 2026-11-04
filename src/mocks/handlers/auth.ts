import { http, HttpResponse } from 'msw'
import {
  ACCOUNT_TYPES,
  CLIENT_ACCOUNT_TYPES,
  type LoginRequestDto,
  type ModuleCode,
  type OtpChallengeDto,
  type OtpChannel,
  type OtpVerifyRequestDto,
  type PasswordResetConfirmDto,
  type SignUpDocument,
} from '@/shared/api/contracts'
import { toMarketDay } from '@/shared/lib/format'
import { addDays } from '@/shared/lib/isoDate'
import {
  accountByEmail,
  accountStore,
  closeSession,
  cookieSession,
  endSession,
  findAccount,
  issueAccessToken,
  modulesOf,
  openSession,
  organizationStore,
  refreshCookie,
  revokeSessions,
  saveAccounts,
  setRequestUser,
  setSessionUser,
  subscriptionStore,
  userOfAccessToken,
} from '../db'
import { DEMO_PASSWORD, isVerifiedType, type StoredAccount } from '../fixtures/accounts'
import { trialPlanOf } from '../fixtures/billing'
import { DEMO_USERS } from '../fixtures/users'
import {
  hashPassword,
  isEmail,
  isSchoolEmail,
  LOCKOUT_MS,
  LOGIN_MAX_FAILURES,
  maskEmail,
  maskPhone,
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_MS,
  OTP_VALID_MS,
  otpCode,
  passwordErrors,
  randomToken,
  RESET_CODE_VALID_MS,
  TRIAL_DAYS,
} from '../lib/auth'
import { api, latency, noContent, problem } from '../lib/http'

interface Challenge {
  userId: string
  code: string
  channel: OtpChannel
  expiresAt: number
  resendAt: number
  attempts: number
}

/** Codes sent, in this tab's mock: a reload starts again from the login page. */
const challenges = new Map<string, Challenge>()
const resetCodes = new Map<string, Omit<Challenge, 'channel' | 'resendAt'>>()

/** Paths open without a session: the login pages, and the prototype's own. */
const PUBLIC_PATHS = ['/auth/', '/_prototype/']

/** Answered with or without a session: the home page shows the plans before login. */
const OPEN_PATHS = ['/subscription/plans']

/** Endpoints of the Analysis and Portfolio modules, refused without them (spec section 10). */
const MODULE_PATHS: [RegExp, ModuleCode][] = [
  [/^\/portfolios(\/|$)/, 'portfolio'],
  [/^\/reports\//, 'portfolio'],
  [/^\/analysis\//, 'analysis'],
  [/^\/yield-curves(\/|$)/, 'analysis'],
  [/^\/bonds\/[^/]+\/calculate$/, 'analysis'],
  [/^\/securities\/[^/]+\/(financials|ratios)$/, 'analysis'],
]

const SIGN_UP_DOCUMENTS: readonly SignUpDocument[] = [
  'proofOfEnrolment',
  'identityDocument',
  'cv',
  'licence',
  'pressCredential',
  'proofOfPosition',
]

function unauthorized() {
  return HttpResponse.json(
    { type: 'about:blank', title: 'Unauthorized', status: 401, detail: 'Log in again.' },
    {
      status: 401,
      headers: {
        'Content-Type': 'application/problem+json',
        'WWW-Authenticate': 'Bearer error="invalid_token"',
      },
    },
  )
}

const apiPath = (url: string) =>
  new URL(url).pathname.slice(new URL(api(''), window.location.origin).pathname.length)

/**
 * First of all handlers: every call but those of the login pages and the home page needs a valid
 * access token, which also tells the other handlers whose data to answer with. The data of the
 * Analysis and Portfolio modules needs a plan with them.
 */
const authGate = http.all(api('/*'), ({ request }) => {
  const path = apiPath(request.url)
  if (PUBLIC_PATHS.some((prefix) => path.startsWith(prefix))) return
  const header = request.headers.get('Authorization') ?? ''
  const userId = header.startsWith('Bearer ') ? userOfAccessToken(header.slice(7)) : null
  // A call without any token to an open path is a visitor's; a token no longer valid is renewed.
  if (!userId) return !header && OPEN_PATHS.includes(path) ? undefined : unauthorized()
  setRequestUser(userId)
  const account = findAccount(userId)
  const module = MODULE_PATHS.find(([pattern]) => pattern.test(path))?.[1]
  if (account && module && !modulesOf(account).includes(module)) {
    return problem(403, 'Module not subscribed', `The plan does not include the ${module} module.`)
  }
})

function challengeDto(challengeId: string, challenge: Challenge, account: StoredAccount) {
  return {
    challengeId,
    channel: challenge.channel,
    destination:
      challenge.channel === 'sms' && account.phone
        ? maskPhone(account.phone)
        : maskEmail(account.email),
    codeLength: OTP_LENGTH,
    expiresAt: new Date(challenge.expiresAt).toISOString(),
    resendAt: new Date(challenge.resendAt).toISOString(),
  } satisfies OtpChallengeDto
}

/**
 * A code by the user's channel; by e-mail after a sign-up, which confirms the address. Within 30
 * seconds, logging in again gives back the code already sent rather than a new one.
 */
function sendChallenge(account: StoredAccount, channel = account.twoFactorChannel) {
  const now = Date.now()
  for (const [id, challenge] of challenges) {
    if (challenge.userId !== account.id) continue
    if (challenge.resendAt > now) return challengeDto(id, challenge, account)
    challenges.delete(id)
  }
  const challenge: Challenge = {
    userId: account.id,
    code: otpCode(),
    channel: channel === 'sms' && account.phone ? 'sms' : 'email',
    expiresAt: now + OTP_VALID_MS,
    resendAt: now + OTP_RESEND_MS,
    attempts: 0,
  }
  const id = randomToken(16)
  challenges.set(id, challenge)
  return challengeDto(id, challenge, account)
}

/** A wrong code: the attempts left, or the end of the code after the fifth. */
function wrongCode(entry: { attempts: number }, onExhausted: () => void) {
  entry.attempts += 1
  const attemptsLeft = OTP_MAX_ATTEMPTS - entry.attempts
  if (attemptsLeft <= 0) {
    onExhausted()
    return problem(429, 'Too many attempts', 'Ask for a new code.')
  }
  return problem(400, 'Wrong code', `Wrong code: ${attemptsLeft} attempts left.`, undefined, {
    attemptsLeft,
  })
}

const minutesUntil = (time: number) => Math.max(1, Math.ceil((time - Date.now()) / 60_000))

const text = (form: FormData, name: string) => String(form.get(name) ?? '').trim()
const isPhone = (value: string) => /^\d{8,15}$/.test(value.replace(/[\s.+-]/g, ''))

/** The sign-up form's errors by field (spec section 12). */
function signUpErrors(form: FormData, documents: Set<SignUpDocument>): Record<string, string[]> {
  const errors: Record<string, string[]> = {}
  const accountType = text(form, 'accountType')
  const email = text(form, 'email')
  const phone = text(form, 'phone')
  if (!CLIENT_ACCOUNT_TYPES.some((type) => type === accountType)) {
    errors.accountType = ['Student, Analyst, Portfolio manager, Trader, Journalist or CEO.']
  }
  if (!text(form, 'displayName')) errors.displayName = ['Give your name.']
  if (!isEmail(email)) errors.email = ['An e-mail address.']
  else if (accountByEmail(email)) errors.email = ['An account already uses this address.']
  const password = passwordErrors(String(form.get('password') ?? ''))
  if (password.length > 0) errors.password = password
  if (phone && !isPhone(phone)) errors.phone = ['A phone number, e.g. +237 6 70 12 34 56.']
  if (form.get('acceptTerms') !== 'true') errors.acceptTerms = ['Accept the terms of use.']
  if (accountType === 'student' && !isSchoolEmail(email) && !documents.has('proofOfEnrolment')) {
    errors.proofOfEnrolment = ['Use your school e-mail address or add a proof of enrolment.']
  }
  if (accountType === 'analyst') {
    if (!documents.has('identityDocument')) errors.identityDocument = ['An identity document.']
    if (!documents.has('cv')) errors.cv = ['Your CV.']
  }
  if (accountType === 'journalist' && !documents.has('pressCredential')) {
    errors.pressCredential = ['Your press card or a letter from your employer.']
  }
  if (accountType === 'ceo') {
    if (!documents.has('proofOfPosition')) errors.proofOfPosition = ['A proof of your position.']
    if (!text(form, 'organizationName')) {
      errors.organizationName = ['The organisation you head.']
    }
  }
  return errors
}

/** POST /auth/*: login with a one-time code, refresh, logout, password reset and sign-up. */
export const authHandlers = [
  authGate,

  http.post(api('/auth/login'), async ({ request }) => {
    await latency()
    const body = (await request.json()) as Partial<LoginRequestDto>
    const account = accountByEmail(String(body.email ?? ''))
    const now = Date.now()
    if (account?.lockedUntil && account.lockedUntil > now) {
      const minutes = minutesUntil(account.lockedUntil)
      return problem(
        429,
        'Account locked',
        `Too many wrong passwords: try again in ${minutes} minutes.`,
        undefined,
        { retryAfterMinutes: minutes },
      )
    }
    const hash = account && (await hashPassword(account.salt, String(body.password ?? '')))
    if (!account || hash !== account.passwordHash) {
      if (account) {
        account.failedLogins += 1
        if (account.failedLogins >= LOGIN_MAX_FAILURES) {
          account.failedLogins = 0
          account.lockedUntil = now + LOCKOUT_MS
        }
        saveAccounts()
      }
      // The same answer for an unknown address: it tells nothing about who has an account.
      return problem(401, 'Invalid credentials', 'Wrong e-mail or password.')
    }
    if (account.status !== 'active') {
      return problem(403, 'Account suspended', 'This account is suspended.')
    }
    account.failedLogins = 0
    account.lockedUntil = null
    saveAccounts()
    return HttpResponse.json(sendChallenge(account))
  }),

  http.post(api('/auth/otp/verify'), async ({ request }) => {
    await latency()
    const body = (await request.json()) as Partial<OtpVerifyRequestDto>
    const id = String(body.challengeId ?? '')
    const challenge = challenges.get(id)
    const account = challenge && findAccount(challenge.userId)
    if (!challenge || !account || challenge.expiresAt <= Date.now()) {
      challenges.delete(id)
      return problem(410, 'Code expired', 'Log in again for a new code.')
    }
    if (String(body.code ?? '').trim() !== challenge.code) {
      return wrongCode(challenge, () => challenges.delete(id))
    }
    challenges.delete(id)
    account.lastLoginAt = new Date().toISOString()
    saveAccounts()
    openSession(account.id)
    setSessionUser(account.id)
    return HttpResponse.json(issueAccessToken(account.id))
  }),

  http.post(api('/auth/refresh'), async () => {
    await latency()
    const session = cookieSession()
    const account = session && findAccount(session.userId)
    if (!session || !account || account.status !== 'active') {
      refreshCookie.write(null)
      return problem(401, 'No session', 'Log in.')
    }
    setSessionUser(account.id)
    return HttpResponse.json(issueAccessToken(account.id))
  }),

  http.post(api('/auth/logout'), async () => {
    await latency()
    closeSession()
    endSession()
    return noContent()
  }),

  // { email } sends a code; { email, code, newPassword } sets the password.
  http.post(api('/auth/password/reset'), async ({ request }) => {
    await latency()
    const body = (await request.json()) as Partial<PasswordResetConfirmDto>
    const email = String(body.email ?? '')
      .trim()
      .toLowerCase()
    if (!isEmail(email))
      return problem(400, 'Invalid request', undefined, { email: ['An e-mail address.'] })
    const now = Date.now()
    if (body.code === undefined) {
      const account = accountByEmail(email)
      if (account) {
        resetCodes.set(email, {
          userId: account.id,
          code: otpCode(),
          expiresAt: now + RESET_CODE_VALID_MS,
          attempts: 0,
        })
      }
      // The same answer whether an account uses the address or not.
      return noContent()
    }
    const reset = resetCodes.get(email)
    const account = reset && findAccount(reset.userId)
    if (!reset || !account || reset.expiresAt <= now) {
      resetCodes.delete(email)
      return problem(410, 'Code expired', 'Ask for a new code.')
    }
    if (String(body.code).trim() !== reset.code) {
      return wrongCode(reset, () => resetCodes.delete(email))
    }
    const errors = passwordErrors(String(body.newPassword ?? ''))
    if (errors.length > 0)
      return problem(400, 'Invalid password', undefined, { newPassword: errors })
    account.salt = randomToken(8)
    account.passwordHash = await hashPassword(account.salt, String(body.newPassword))
    account.failedLogins = 0
    account.lockedUntil = null
    saveAccounts()
    resetCodes.delete(email)
    revokeSessions(account.id, { keepCurrent: false })
    return noContent()
  }),

  http.post(api('/auth/register'), async ({ request }) => {
    await latency()
    const form = await request.formData()
    const files = SIGN_UP_DOCUMENTS.flatMap((kind) => {
      const file = form.get(kind)
      return file instanceof File && file.size > 0
        ? [{ kind, fileName: file.name, size: file.size }]
        : []
    })
    const errors = signUpErrors(form, new Set(files.map((file) => file.kind)))
    if (Object.keys(errors).length > 0) return problem(400, 'Invalid sign-up', undefined, errors)

    const now = new Date()
    const accountType = CLIENT_ACCOUNT_TYPES.find((type) => type === text(form, 'accountType'))!
    const organizationName = text(form, 'organizationName')
    const organizationId = organizationName ? `org-${randomToken(6)}` : null
    if (organizationId) {
      const organizations = organizationStore.read()
      organizations.push({
        id: organizationId,
        name: organizationName,
        createdAt: now.toISOString(),
      })
      organizationStore.write(organizations)
    }
    const salt = randomToken(8)
    const account: StoredAccount = {
      id: `user-${randomToken(6)}`,
      email: text(form, 'email').toLowerCase(),
      salt,
      passwordHash: await hashPassword(salt, String(form.get('password'))),
      displayName: text(form, 'displayName'),
      accountType,
      organizationId,
      organizationRole: organizationId ? 'admin' : null,
      language: text(form, 'language') === 'fr' ? 'fr' : 'en',
      timeZone: 'Africa/Douala',
      phone: text(form, 'phone') || null,
      twoFactorChannel: 'email',
      // An Admin approves the status of an Analyst, a Journalist or a CEO (spec section 12).
      verificationStatus: isVerifiedType(accountType) ? 'pending' : null,
      status: 'active',
      createdAt: now.toISOString(),
      documents: files,
      failedLogins: 0,
      lockedUntil: null,
      lastLoginAt: null,
      verificationDecision: null,
      suspension: null,
    }
    accountStore.write([...accountStore.read(), account])
    // The free trial of spec section 6, for the account or its new organisation.
    const today = toMarketDay(now)
    subscriptionStore.write([
      ...subscriptionStore.read(),
      {
        id: `subscription-${account.id}`,
        payer: organizationId
          ? { type: 'organization', id: organizationId }
          : { type: 'user', id: account.id },
        planId: trialPlanOf(accountType),
        status: 'trial',
        billingCycle: null,
        periodStart: today,
        periodEnd: addDays(today, TRIAL_DAYS),
        method: null,
      },
    ])
    return HttpResponse.json(sendChallenge(account, 'email'), { status: 201 })
  }),

  // Prototype only, not part of CMarket.Api: the codes the mock would have sent by e-mail or SMS.
  http.get(api('/_prototype/codes'), ({ request }) => {
    const query = new URL(request.url).searchParams
    const challengeId = query.get('challengeId')
    const email = query.get('email')?.trim().toLowerCase()
    const code = challengeId
      ? challenges.get(challengeId)?.code
      : email
        ? resetCodes.get(email)?.code
        : undefined
    return code ? HttpResponse.json({ code }) : problem(404, 'No code sent')
  }),

  // Prototype only: the demo accounts listed on the login page.
  http.get(api('/_prototype/accounts'), () =>
    HttpResponse.json({
      password: DEMO_PASSWORD,
      accounts: ACCOUNT_TYPES.map((accountType) => ({
        accountType,
        email: DEMO_USERS[accountType].email,
        displayName: DEMO_USERS[accountType].displayName,
      })),
    }),
  ),

  // Prototype only: the account switch of the user menu opens a session for a demo user.
  http.put(api('/_prototype/session'), async ({ request }) => {
    const body = (await request.json()) as { accountType?: string }
    const accountType = ACCOUNT_TYPES.find((candidate) => candidate === body.accountType)
    if (!accountType) return problem(400, 'Unknown account type')
    closeSession()
    openSession(DEMO_USERS[accountType].id)
    return noContent()
  }),
]
