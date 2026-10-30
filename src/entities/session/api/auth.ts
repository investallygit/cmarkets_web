import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, endSession, refreshAccessToken, startSession } from '@/shared/api'
import type {
  AccessTokenDto,
  LoginRequestDto,
  OtpChallengeDto,
  OtpVerifyRequestDto,
  PasswordResetConfirmDto,
  PasswordResetRequestDto,
} from '@/shared/api/contracts'
import { sessionKeys } from './queries'

/** The login pages call the API without a session; the refresh cookie goes both ways. */
const ANONYMOUS = { anonymous: true } as const

/** At start-up, POST /auth/refresh trades the cookie of the last login, if any, for a session. */
export function useRestoreSession(enabled: boolean) {
  return useQuery({
    queryKey: sessionKeys.restore,
    queryFn: () => refreshAccessToken(),
    enabled,
    retry: false,
    staleTime: Infinity,
  })
}

/** POST /auth/login: e-mail and password. The answer says where the one-time code went. */
export function useLogin() {
  return useMutation({
    mutationFn: (request: LoginRequestDto) =>
      apiClient.post<OtpChallengeDto>('/auth/login', request, ANONYMOUS),
  })
}

/** POST /auth/otp/verify: the code opens the session, after what a previous user left is gone. */
export function useVerifyOtp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: OtpVerifyRequestDto) =>
      apiClient.post<AccessTokenDto>('/auth/otp/verify', request, ANONYMOUS),
    onSuccess: (token) => {
      queryClient.clear()
      startSession(token)
    },
  })
}

/** POST /auth/register, a multipart form with the documents; a code then confirms the address. */
export function useRegister() {
  return useMutation({
    mutationFn: (form: FormData) =>
      apiClient.postForm<OtpChallengeDto>('/auth/register', form, ANONYMOUS),
  })
}

/** POST /auth/password/reset, first step: a code goes to the address. */
export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (request: PasswordResetRequestDto) =>
      apiClient.post<void>('/auth/password/reset', request, ANONYMOUS),
  })
}

/** POST /auth/password/reset, second step: the code and the new password. */
export function useConfirmPasswordReset() {
  return useMutation({
    mutationFn: (request: PasswordResetConfirmDto) =>
      apiClient.post<void>('/auth/password/reset', request, ANONYMOUS),
  })
}

/**
 * POST /auth/logout: the server revokes the refresh token. The session ends here whatever the
 * answer, and the other tabs follow.
 */
export function useLogout() {
  return useMutation({
    mutationFn: async (reason: 'logout' | 'inactivity') => {
      await apiClient.post<void>('/auth/logout', undefined, ANONYMOUS)
      return reason
    },
    onSettled: (_result, _error, reason) => endSession(reason),
  })
}
