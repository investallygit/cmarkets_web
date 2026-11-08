import type {
  AccessTokenDto,
  LoginRequestDto,
  OtpChallengeDto,
  OtpVerifyRequestDto,
  PasswordResetConfirmDto,
  PasswordResetRequestDto,
} from '../contracts'
import { answer, route, send, sendForm } from './define'

/** CMarket.Api/Controllers/Auth: login, one-time code, sign-up, password reset, logout. */
export const authRoutes = {
  login: route('POST', '/auth/login', answer<OtpChallengeDto>()),
  verifyOtp: route('POST', '/auth/otp/verify', answer<AccessTokenDto>()),
  /** Sent by session.ts itself, beneath the client, which renews the token through it. */
  refresh: route('POST', '/auth/refresh', answer<AccessTokenDto>()),
  logout: route('POST', '/auth/logout'),
  resetPassword: route('POST', '/auth/password/reset'),
  register: route('POST', '/auth/register', answer<OtpChallengeDto>()),
}

/** The login pages call the API without a session; the refresh cookie goes both ways. */
const anonymous = true

export const authApi = {
  login: (request: LoginRequestDto) => send(authRoutes.login, { body: request, anonymous }),
  verifyOtp: (request: OtpVerifyRequestDto) =>
    send(authRoutes.verifyOtp, { body: request, anonymous }),
  logout: () => send(authRoutes.logout, { anonymous }),
  /** First step: a code goes to the address. */
  requestPasswordReset: (request: PasswordResetRequestDto) =>
    send(authRoutes.resetPassword, { body: request, anonymous }),
  /** Second step: the code and the new password. */
  confirmPasswordReset: (request: PasswordResetConfirmDto) =>
    send(authRoutes.resetPassword, { body: request, anonymous }),
  /** A multipart form with the documents; a code then confirms the address. */
  register: (form: FormData) => sendForm(authRoutes.register, form, { anonymous }),
}
