import { useMutation, useQueries, useQuery } from '@tanstack/react-query'
import { ADMIN_QUERY_ROOT, apiClient, useRefreshAdminData } from '@/shared/api'
import {
  ACCOUNT_TYPES,
  type AccountType,
  type AdminSpecialtyDto,
  type DirectorySettingsDto,
  type DirectorySettingsUpdateDto,
  type Permission,
  type PlatformSettingsDto,
  type PlatformSettingsUpdateDto,
  type RolePermissionsDto,
  type SpecialtyInputDto,
} from '@/shared/api/contracts'

export const settingsKeys = {
  all: [...ADMIN_QUERY_ROOT, 'settings'] as const,
  platform: () => [...settingsKeys.all, 'platform'] as const,
  role: (role: AccountType) => [...settingsKeys.all, 'role', role] as const,
  directory: () => [...settingsKeys.all, 'directory'] as const,
  specialties: () => [...settingsKeys.all, 'specialties'] as const,
}

const rolePath = (role: AccountType) => `/admin/roles/${role}/permissions`

/** GET /admin/settings: quotas, research pricing and moderation, risk-free rate. */
export function usePlatformSettings() {
  return useQuery({
    queryKey: settingsKeys.platform(),
    queryFn: ({ signal }) => apiClient.get<PlatformSettingsDto>('/admin/settings', { signal }),
  })
}

/** PUT /admin/settings: each change is written to the audit log. */
export function useSavePlatformSettings() {
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: (settings: PlatformSettingsUpdateDto) =>
      apiClient.put<PlatformSettingsDto>('/admin/settings', settings),
    onSuccess: refresh,
  })
}

/** GET /admin/roles/{role}/permissions for the eight account types: the permission matrix. */
export function useRolePermissions() {
  return useQueries({
    queries: ACCOUNT_TYPES.map((role) => ({
      queryKey: settingsKeys.role(role),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        apiClient.get<RolePermissionsDto>(rolePath(role), { signal }),
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
    mutationFn: ({ role, permissions }: RolePermissionsDto) =>
      apiClient.put<RolePermissionsDto>(rolePath(role), { role, permissions }),
    onSuccess: refresh,
  })
}

/** GET /admin/settings/directory, the prototype's: default contact rules, limits, threshold. */
export function useDirectorySettings() {
  return useQuery({
    queryKey: settingsKeys.directory(),
    queryFn: ({ signal }) =>
      apiClient.get<DirectorySettingsDto>('/admin/settings/directory', { signal }),
  })
}

/** PUT /admin/settings/directory: each change is written to the audit log. */
export function useSaveDirectorySettings() {
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: (settings: DirectorySettingsUpdateDto) =>
      apiClient.put<DirectorySettingsDto>('/admin/settings/directory', settings),
    onSuccess: refresh,
  })
}

const specialtyPath = (id: string) => `/admin/specialties/${encodeURIComponent(id)}`

/** GET /admin/specialties, the prototype's: the closed list and the profiles listing each. */
export function useAdminSpecialties() {
  return useQuery({
    queryKey: settingsKeys.specialties(),
    queryFn: ({ signal }) => apiClient.get<AdminSpecialtyDto[]>('/admin/specialties', { signal }),
  })
}

/** POST /admin/specialties */
export function useAddSpecialty() {
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: (input: SpecialtyInputDto) =>
      apiClient.post<AdminSpecialtyDto>('/admin/specialties', input),
    onSuccess: refresh,
  })
}

/** PUT /admin/specialties/{id}: the names in French and English. */
export function useRenameSpecialty() {
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: ({ id, name }: { id: string } & SpecialtyInputDto) =>
      apiClient.put<AdminSpecialtyDto>(specialtyPath(id), { name }),
    onSuccess: refresh,
  })
}

/** DELETE /admin/specialties/{id}: one that no profile lists. */
export function useRemoveSpecialty() {
  const refresh = useRefreshAdminData()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(specialtyPath(id)),
    onSuccess: refresh,
  })
}
