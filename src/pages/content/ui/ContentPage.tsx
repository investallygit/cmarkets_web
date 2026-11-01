import { ScreenWorkspace, type ScreenPanel } from '@/features/workspace-layout'
import type { NewsTab } from '@/shared/routes/paths'
import { useSearchParamsUpdate, withParams } from '@/shared/routes/useSearchParamsUpdate'
import { ContentEditorPanel, ContentListPanel } from '@/widgets/content-panels'

/** NEWS has no mockup: what was published on the left, the editor on the right. */
const LAYOUT: readonly ScreenPanel[] = [
  { i: 'list', name: 'contentList', x: 0, y: 0, w: 7, h: 26, minW: 4, minH: 8 },
  { i: 'editor', name: 'contentEditor', x: 7, y: 0, w: 5, h: 26, minW: 4, minH: 12 },
]

/**
 * NEWS (spec section 5): the Data admin publishes the news and documents of African issuers and
 * institutions, and edits them. The tab and the item edited are in the URL (?tab=documents&id=).
 */
export function ContentPage() {
  const [params, updateParams] = useSearchParamsUpdate()
  const tab: NewsTab = params.get('tab') === 'documents' ? 'documents' : 'news'
  const itemId = params.get('id')
  const set = (values: Record<string, string>) =>
    updateParams((current) => withParams(current, values))

  const panels = {
    list: (
      <ContentListPanel
        tab={tab}
        onTabChange={(value) => set({ tab: value === 'news' ? '' : value, id: '' })}
        selectedId={itemId}
        onSelect={(id) => set({ id })}
      />
    ),
    editor: (
      <ContentEditorPanel
        kind={tab}
        itemId={itemId}
        onSaved={(id) => set({ id })}
        onNew={() => set({ id: '' })}
      />
    ),
  }
  return <ScreenWorkspace screenId="NEWS" defaultLayout={LAYOUT} panels={panels} />
}
