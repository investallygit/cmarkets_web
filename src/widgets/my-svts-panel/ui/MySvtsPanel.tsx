import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDailyLimit, isLinkInForce, LINK_TONES, useMySvts } from '@/entities/svt-link'
import { AddSvtDialog, RemoveSvtButton } from '@/features/manage-svt-links'
import type { SvtLinkDto } from '@/shared/api/contracts'
import { useFormat, useLocale } from '@/shared/i18n'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/form/Button'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

/**
 * Screen 22's "My SVTs" (spec section 9; API /me/svt): the SVTs the trader asked, each with its
 * status and its date, as the mockup ("Confirmed …", "Request sent 28/10 · expires 04/11", "Link
 * withdrawn by the SVT on 15/10"); a link in force is removed here; "Add an SVT" asks another. Only
 * a confirmed SVT is chosen for a request or an answer (ROADMAP step 44).
 */
export function MySvtsPanel() {
  const { t } = useTranslation()
  const mine = useMySvts()
  const [adding, setAdding] = useState(false)
  const inForce = new Set(
    (mine.data?.links ?? []).filter((link) => isLinkInForce(link.status)).map((link) => link.svtId),
  )
  const askable = (mine.data?.svts ?? []).filter((svt) => !inForce.has(svt.id))

  return (
    <Panel
      title={t('panels.mySvts')}
      code="RFQ"
      options={
        <Button size="sm" variant="info" icon={Plus} onClick={() => setAdding(true)}>
          {t('rfq.mySvts.addShort')}
        </Button>
      }
    >
      <QueryView query={mine}>
        {({ links }) => (
          <div className="flex flex-col gap-3 p-2">
            {links.length === 0 ? (
              <p className="px-1 font-sans text-data text-secondary">{t('rfq.mySvts.empty')}</p>
            ) : (
              <ul className="flex flex-col" aria-label={t('panels.mySvts')}>
                {links.map((link) => (
                  <SvtRow key={link.id} link={link} />
                ))}
              </ul>
            )}
            <Button variant="info" icon={Plus} onClick={() => setAdding(true)}>
              {t('rfq.mySvts.add')}
            </Button>
            <p className="px-1 font-sans text-label text-secondary">{t('rfq.mySvts.note')}</p>
          </div>
        )}
      </QueryView>
      <AddSvtDialog open={adding} onClose={() => setAdding(false)} svts={askable} />
    </Panel>
  )
}

function SvtRow({ link }: { link: SvtLinkDto }) {
  const { t } = useTranslation()
  const name = t('rfq.mySvts.svtName', { name: link.svtName })
  return (
    <li className="flex items-start justify-between gap-2 border-b px-1 py-2 last:border-b-0">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="font-sans text-data font-semibold text-primary">{name}</span>
        <span className="font-sans text-label text-secondary">
          <LinkDetail link={link} />
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Badge tone={LINK_TONES[link.status]}>{t(`rfq.linkStatus.${link.status}`)}</Badge>
        {isLinkInForce(link.status) && <RemoveSvtButton svtId={link.svtId} name={link.svtName} />}
      </div>
    </li>
  )
}

/** The line under the SVT's name: when it was confirmed and the limit, or asked, or ended. */
function LinkDetail({ link }: { link: SvtLinkDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const locale = useLocale()
  switch (link.status) {
    case 'confirmed':
      return link.dailyLimit === null
        ? t('rfq.mySvts.confirmed', { date: format.date(link.decidedAt ?? link.requestedAt) })
        : t('rfq.mySvts.confirmedLimit', {
            date: format.date(link.decidedAt ?? link.requestedAt),
            limit: formatDailyLimit(link.dailyLimit, locale),
          })
    case 'pending':
      return t('rfq.mySvts.pending', {
        date: format.dayMonth(link.requestedAt),
        expires: format.dayMonth(link.expiresAt),
      })
    case 'declined':
      return t('rfq.mySvts.declined', { date: format.dayMonth(link.decidedAt ?? link.requestedAt) })
    case 'expired':
      return t('rfq.mySvts.expired', { date: format.dayMonth(link.endedAt ?? link.expiresAt) })
    case 'withdrawn':
      return link.endedBy === 'svt'
        ? t('rfq.mySvts.withdrawnBySvt', { date: format.dayMonth(link.endedAt ?? link.expiresAt) })
        : t('rfq.mySvts.withdrawnByTrader', {
            date: format.dayMonth(link.endedAt ?? link.expiresAt),
          })
  }
}
