import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isApiError } from '@/shared/api'
import type {
  DescribedObject,
  DescriptionDto,
  DescriptionLanguage,
  DescriptionWriteDto,
} from '@/shared/api/contracts'
import { dataAdminApi, marketApi, securitiesApi } from '@/shared/api/endpoints'

export const descriptionKeys = {
  all: ['descriptions'] as const,
  of: (type: DescribedObject, id: string) => [...descriptionKeys.all, type, id] as const,
  shown: (type: DescribedObject, id: string, language: DescriptionLanguage) =>
    [...descriptionKeys.of(type, id), 'shown', language] as const,
  versions: (type: DescribedObject, id: string) =>
    [...descriptionKeys.of(type, id), 'versions'] as const,
}

/**
 * GET /securities/{id}/description?lang= or /indices/{code}/description?lang= (spec section 9,
 * screens 2, 3 and 31, fifth version): the latest version in the language asked, else in the other
 * one; null when none is written.
 */
export function useDescription(
  type: DescribedObject,
  id: string | undefined,
  language: DescriptionLanguage,
) {
  return useQuery({
    queryKey: descriptionKeys.shown(type, id ?? '', language),
    queryFn: async ({ signal }): Promise<DescriptionDto | null> => {
      try {
        return type === 'index'
          ? await marketApi.indexDescription(id ?? '', language, signal)
          : await securitiesApi.description(id ?? '', language, signal)
      } catch (error) {
        if (isApiError(error, 404)) return null
        throw error
      }
    },
    enabled: Boolean(id),
  })
}

/** GET /admin/descriptions/{type}/{id} (CORR, DES's Edit): every version CMarket wrote. */
export function useDescriptionVersions(type: DescribedObject, id: string | null) {
  return useQuery({
    queryKey: descriptionKeys.versions(type, id ?? ''),
    queryFn: ({ signal }) => dataAdminApi.descriptions(type, id ?? '', signal),
    enabled: Boolean(id),
  })
}

/**
 * PUT /admin/descriptions/{type}/{id}: a new version of one language, an empty text removing it
 * (ROADMAP decision 40); the screens that show it read it again.
 */
export function useDescribe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      type,
      id,
      description,
    }: {
      type: DescribedObject
      id: string
      description: DescriptionWriteDto
    }) => dataAdminApi.describe(type, id, description),
    onSuccess: (versions) => {
      const { objectType, objectId } = versions
      queryClient.setQueryData(descriptionKeys.versions(objectType, objectId), versions)
      return queryClient.invalidateQueries({
        queryKey: [...descriptionKeys.of(objectType, objectId), 'shown'],
      })
    },
  })
}
