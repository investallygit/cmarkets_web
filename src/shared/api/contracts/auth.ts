import type { IsoDateTime } from './common'
import type { ClientAccountType, OtpChannel, UserLanguage } from './me'

/** POST /auth/login */
export interface LoginRequestDto {
  email: string
  password: string
}

/**
 * Answer of POST /auth/login and /auth/register: a one-time code was sent, to give to
 * POST /auth/otp/verify. A new code is asked by logging in again.
 */
export interface OtpChallengeDto {
  challengeId: string
  channel: OtpChannel
  /** Where the code went, masked by the server: "k•••@analyst.example". */
  destination: string
  codeLength: number
  expiresAt: IsoDateTime
  /** A new code may be asked from then on. */
  resendAt: IsoDateTime
}

/** POST /auth/otp/verify */
export interface OtpVerifyRequestDto {
  challengeId: string
  code: string
}

/**
 * POST /auth/otp/verify and /auth/refresh. The refresh token (7 days) comes as an HttpOnly cookie
 * scoped to /auth, which scripts cannot read; the access token (15 minutes) stays in memory.
 */
export interface AccessTokenDto {
  accessToken: string
  tokenType: 'Bearer'
  /** Seconds. */
  expiresIn: number
}

/** POST /auth/password/reset, first step: a code goes to the address if an account uses it. */
export interface PasswordResetRequestDto {
  email: string
}

/** POST /auth/password/reset, second step. */
export interface PasswordResetConfirmDto {
  email: string
  code: string
  newPassword: string
}

/** Documents of a sign-up: proof of enrolment for a Student, identity, CV, licence for an Analyst. */
export type SignUpDocument = 'proofOfEnrolment' | 'identityDocument' | 'cv' | 'licence'

/**
 * POST /auth/register, sent as a multipart form: these fields, then the documents. A Student
 * without a school e-mail address adds a proof of enrolment; an Analyst adds an identity document
 * and a CV, and a licence if any, for the Admin who approves the status (spec section 12).
 */
export interface RegisterRequestDto {
  accountType: ClientAccountType
  displayName: string
  email: string
  password: string
  phone: string | null
  /** Opens an organisation account with the user as its administrator. */
  organizationName: string | null
  language: UserLanguage
  acceptTerms: boolean
}
