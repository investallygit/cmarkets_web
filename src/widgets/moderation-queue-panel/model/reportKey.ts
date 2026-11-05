import type { ReportedItemDto } from '@/shared/api/contracts'

/** "profile:user-abessolo": what the URL and the selection keep of a reported item. */
export const reportKey = (item: Pick<ReportedItemDto, 'type' | 'id'>) => `${item.type}:${item.id}`
