import { useQueryClient } from '@tanstack/react-query'
import { useRealtimeEvent } from '@/shared/realtime'
import { libraryKeys } from './libraryQueries'

/** A publication or an update went out: the library lists show it. Mounted by the app shell. */
export function usePublicationRealtimeSync() {
  const queryClient = useQueryClient()
  useRealtimeEvent('PublicationPublished', (event) => {
    void queryClient.invalidateQueries({ queryKey: libraryKeys.lists() })
    void queryClient.invalidateQueries({ queryKey: libraryKeys.detail(event.publicationId) })
  })
}
