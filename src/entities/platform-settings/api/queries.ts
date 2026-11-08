import { useMutation, useQueries, useQuery } from '@tanstack/react-query'
import { ADMIN_QUERY_ROOT, useRefreshAdminData } from '@/shared/api'
import {
  ACCOUNT_TYPES,
  type AccountType,
  type Permission,
  type SpecialtyInputDto,
} from '@/shared/api/contracts'
import { adminApi } from '@/shared/api/endpoints'

export const settingsKeys = {
  all: [...ADMIN_QUERY_ROOT, 'settings'] as const,
  platform: () => [...settingsKeys.all, 'platform'] as const,
  role: (role: AccountType) => [...settingsKeys.all, 'role', role] as const,
  directory: () => [...settingsKeys.all, 'directory'] as const,
  specialties: () => [...settingsKeys.all, 'specialties'] as const,
}

/** GET /admin/settings: quotas, research pricing and moderation, risk-free rate. */
export function usePlatformSettings() {
  return useQuery({
    queryKey: settingsKeys.platform(),
    queryFn: ({ signal }) => adminApi.settings(signal),
  })
}

/** PUT /admin/settings: each change is written to the audit log. */
export function useSavePlatformSettings() {
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: adminApi.saveSettings,
    onSuccess: refresh,
  })
}

/** GET /admin/roles/{role}/permissions for the eight account types: the permission matrix. */
export function useRolePermissions() {
  return useQueries({
    queries: ACCOUNT_TYPES.map((role) => ({
      queryKey: settingsKeys.role(role),
      queryFn: ({ signal }: { signal: AbortSignal }) => adminApi.rolePermissions(role, signal),
    })),
    combine: (results) => ({
      data: results.every((result) => result.data)
        ? (Object.fromEntries(
            results.map((result) => [result.data?.role, result.data?.permissions ?? []]),
          ) as Record<AccountType, Permission[]>)
        : undefined,
      isPending: results.some((result) => result.isPending),
      error: results.find((result) => result.error)?.error ?? null,
      refetch: () => Promise.all(results.map((result) => result.refetch())),
    }),
  })
}

/** PUT /admin/roles/{role}/permissions */
export function useSaveRolePermissions() {
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: adminApi.saveRolePermissions,
    onSuccess: refresh,
  })
}

/** GET /admin/settings/directory, the prototype's: default contact rules, limits, threshold. */
export function useDirectorySettings() {
  return useQuery({
    queryKey: settingsKeys.directory(),
    queryFn: ({ signal }) => adminApi.directorySettings(signal),
  })
}

/** PUT /admin/settings/directory: each change is written to the audit log. */
export function useSaveDirectorySettings() {
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: adminApi.saveDirectorySettings,
    onSuccess: refresh,
  })
}

/** GET /admin/specialties, the prototype's: the closed list and the profiles listing each. */
export function useAdminSpecialties() {
  return useQuery({
    queryKey: settingsKeys.specialties(),
    queryFn: ({ signal }) => adminApi.specialties(signal),
  })
}

/** POST /admin/specialties */
export function useAddSpecialty() {
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: adminApi.addSpecialty,
    onSuccess: refresh,
  })
}

/** PUT /admin/specialties/{id}: the names in French and English. */
export function useRenameSpecialty() {
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: ({ id, name }: { id: string } & SpecialtyInputDto) =>
      adminApi.renameSpecialty(id, { name }),
    onSuccess: refresh,
  })
}

/** DELETE /admin/specialties/{id}: one that no profile lists. */
export function useRemoveSpecialty() {
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: adminApi.removeSpecialty,
    onSuccess: refresh,
  })
}
