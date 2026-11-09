import type { NewsItemDto } from '@/shared/api/contracts'

/** What sharing needs of an article: its id for the address and the card, its headline to show. */
export type SharedArticle = Pick<NewsItemDto, 'id' | 'headline'>
