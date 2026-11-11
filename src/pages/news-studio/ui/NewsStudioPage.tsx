import { Hourglass } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMyNews, useProviderNews } from '@/entities/news'
import { useCurrentUser } from '@/entities/session'
import { closeNewsDraft, NewNewsDialog, useNewsAutosave } from '@/features/edit-news'
import { ScreenWorkspace } from '@/features/workspace-layout'
import { useSearchParamsUpdate, withParams } from '@/shared/routes/useSearchParamsUpdate'
import {
  MyNewsPanel,
  NewsEarningsPanel,
  NewsEditorPanel,
  NewsImportPanel,
  NewsPublishingPanel,
  NewsStatementsPanel,
} from '@/widgets/news-studio-panels'
import { NEWS_STUDIO_LAYOUT } from '../config/layout'

/**
 * NEWS NEW, the news studio of a partner newspaper (screen 13): My news and the month's earnings,
 * the editor and the publishing settings of the item open, the file import. The open item lives in
 * the address (?id=); the newest draft opens otherwise, else the newest item. A News provider not
 * approved yet only sees why.
 */
export function NewsStudioPage() {
  const { verificationStatus } = useCurrentUser()
  return verificationStatus === 'approved' ? (
    <Studio />
  ) : (
    <AwaitingApproval rejected={verificationStatus === 'rejected'} />
  )
}

function Studio() {
  const [params, update] = useSearchParamsUpdate()
  const [creating, setCreating] = useState(false)
  const mine = useMyNews({ status: null, type: null, pageSize: 200 })
  // The work in progress first: the newest draft, else the newest item.
  const items = mine.data?.items ?? []
  const selectedId =
    params.get('id') ?? (items.find((item) => item.status === 'draft') ?? items.at(0))?.id ?? null
  useNewsAutosave(useProviderNews(selectedId).data)
  // The next visit opens its item afresh.
  useEffect(() => closeNewsDraft, [])
  const select = (id: string) => update((current) => withParams(current, { id }))

  const panels = {
    mine: (
      <MyNewsPanel selectedId={selectedId} onSelect={select} onCreate={() => setCreating(true)} />
    ),
    earnings: <NewsEarningsPanel />,
    statements: <NewsStatementsPanel />,
    editor: <NewsEditorPanel newsId={selectedId} />,
    publishing: <NewsPublishingPanel newsId={selectedId} />,
    import: <NewsImportPanel />,
  }
  return (
    <>
      <ScreenWorkspace screenId="NEWSNEW" defaultLayout={NEWS_STUDIO_LAYOUT} panels={panels} />
      <NewNewsDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(item) => select(item.id)}
      />
    </>
  )
}

function AwaitingApproval({ rejected }: { rejected: boolean }) {
  const { t } = useTranslation()
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="flex max-w-md flex-col items-center gap-3 border bg-panel p-6 text-center">
        <Hourglass aria-hidden className="size-6 text-accent-amber" />
        <h2 className="font-sans text-figure font-semibold">
          {t(rejected ? 'newsStudio.approval.rejectedTitle' : 'newsStudio.approval.title')}
        </h2>
        <p className="font-sans text-label text-secondary">
          {t(rejected ? 'newsStudio.approval.rejected' : 'newsStudio.approval.waiting')}
        </p>
      </div>
    </div>
  )
}
