import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { endSession, refreshAccessToken, startSession } from '@/shared/api'
import { authApi } from '@/shared/api/endpoints'
import { sessionKeys } from './queries'

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
    mutationFn: authApi.login,
  })
}

/** POST /auth/otp/verify: the code opens the session, after what a previous user left is gone. */
export function useVerifyOtp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: authApi.verifyOtp,
    onSuccess: (token) => {
      queryClient.clear()
      startSession(token)
    },
  })
}

/** POST /auth/register, a multipart form with the documents; a code then confirms the address. */
export function useRegister() {
  return useMutation({
    mutationFn: authApi.register,
  })
}

/** POST /auth/password/reset, first step: a code goes to the address. */
export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: authApi.requestPasswordReset,
  })
}

/** POST /auth/password/reset, second step: the code and the new password. */
export function useConfirmPasswordReset() {
  return useMutation({
    mutationFn: authApi.confirmPasswordReset,
  })
}

/**
 * POST /auth/logout: the server revokes the refresh token. The session ends here whatever the
 * answer, and the other tabs follow.
 */
export function useLogout() {
  return useMutation({
    mutationFn: async (reason: 'logout' | 'inactivity') => {
      await authApi.logout()
      return reason
    },
    onSettled: (_result, _error, reason) => endSession(reason),
  })
}
