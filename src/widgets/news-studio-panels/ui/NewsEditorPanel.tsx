import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useProviderNews } from '@/entities/news'
import { NewsEditor, NewsPreviewDialog, NewsSaveStatus } from '@/features/edit-news'
import { Panel } from '@/shared/ui/Panel'
import { PanelEmpty } from '@/shared/ui/StatusViews'
import { QueryView } from '@/shared/ui/QueryView'

/**
 * Screen 13, centre: the editor of the item open, with the time of its last save and the reader
 * preview in the title bar. API GET / PUT /provider/news/{id}.
 */
export function NewsEditorPanel({ newsId }: { newsId: string | null }) {
  const { t } = useTranslation()
  const item = useProviderNews(newsId)
  const [previewing, setPreviewing] = useState(false)

  return (
    <Panel
      title={t('panels.editor')}
      code="NEWS"
      options={
        item.data && (
          <>
            <NewsSaveStatus />
            <span aria-hidden>·</span>
            <button
              type="button"
              onClick={() => setPreviewing(true)}
              className="panel-no-drag uppercase hover:text-primary"
            >
              {t('newsStudio.publishing.preview')}
            </button>
          </>
        )
      }
    >
      {newsId === null ? (
        <PanelEmpty message={t('newsStudio.mine.choose')} />
      ) : (
        <QueryView query={item}>
          {() => (
            <>
              <NewsEditor />
              <NewsPreviewDialog open={previewing} onClose={() => setPreviewing(false)} />
            </>
          )}
        </QueryView>
      )}
    </Panel>
  )
}
