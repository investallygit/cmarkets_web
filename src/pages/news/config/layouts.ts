import type { NewsTab } from '@/shared/routes/paths'
import type { ScreenPanel } from '@/features/workspace-layout'

/** N has no mockup: the list on the left, the article or the document on the right. */
// prettier-ignore
export const NEWS_LAYOUTS: Record<NewsTab, readonly ScreenPanel[]> = {
  news: [
    { i: 'list', name: 'securityNews', x: 0, y: 0, w: 5, h: 26, minW: 3, minH: 6 },
    { i: 'article', name: 'article', x: 5, y: 0, w: 7, h: 26, minW: 3, minH: 6 },
  ],
  documents: [
    { i: 'list', name: 'documents', x: 0, y: 0, w: 5, h: 26, minW: 3, minH: 6 },
    { i: 'viewer', name: 'document', x: 5, y: 0, w: 7, h: 26, minW: 4, minH: 10 },
  ],
}

/** Layout key of a tab for /me/layouts/{screen}: N, N-DOC. */
export function layoutKey(tab: NewsTab): string {
  return tab === 'news' ? 'N' : 'N-DOC'
}
