import { Link2, Send } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { mayWriteMessages, useCurrentUser } from '@/entities/session'
import { newsPath, shareableUrl } from '@/shared/routes/paths'
import { toast } from '@/shared/ui/toast'
import type { SharedArticle } from '../model/types'
import { ShareNewsDialog } from './ShareNewsDialog'

const ACTION = 'panel-no-drag inline-flex items-center gap-1 uppercase hover:text-primary'

/**
 * What the title bar of an article offers: its address to paste anywhere, and, for a member who
 * writes messages, the article sent as a card to one of their conversations.
 */
export function ShareNewsActions({ article }: { article: SharedArticle }) {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const [sharing, setSharing] = useState(false)

  const copyLink = async () => {
    const url = shareableUrl(newsPath(article.id))
    try {
      // Missing outside a secure context, refused without the page's focus.
      await navigator.clipboard.writeText(url)
      toast.success(t('news.linkCopied'))
    } catch {
      toast.error(t('news.copyFailed', { url }))
    }
  }

  return (
    <>
      <button type="button" onClick={() => void copyLink()} className={ACTION}>
        <Link2 aria-hidden className="size-3" />
        {t('news.copyLink')}
      </button>
      {mayWriteMessages(user) && (
        <>
          <button type="button" onClick={() => setSharing(true)} className={ACTION}>
            <Send aria-hidden className="size-3" />
            {t('news.share.open')}
          </button>
          <ShareNewsDialog article={article} open={sharing} onClose={() => setSharing(false)} />
        </>
      )}
    </>
  )
}
