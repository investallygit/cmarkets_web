import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useCommodityRelated } from '@/entities/commodity'
import { NewsTypeTag } from '@/entities/news'
import { useFormat } from '@/shared/i18n'
import { ecoPath, newsPath, securityPath } from '@/shared/routes/paths'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

/** The CEMAC states by their World Bank codes, which ECO opens (`ECO CMR`). */
const WORLD_BANK_CODES: Record<string, string> = {
  CM: 'CMR',
  GA: 'GAB',
  CG: 'COG',
  GQ: 'GNQ',
  TD: 'TCD',
  CF: 'CAF',
}

/**
 * Screen 21, the CEMAC links (spec section 9): the countries exposed (each opens its ECO), the
 * related bonds and equities (each opens its profile), the latest news naming the commodity with
 * their tags. API /commodities/{code}/related.
 */
export function CommodityLinksPanel({ code }: { code: string }) {
  const { t } = useTranslation()
  const format = useFormat()
  const related = useCommodityRelated(code)

  return (
    <Panel title={t('panels.commodityLinks')} code="DES" bodyClassName="flex min-h-0 flex-col">
      <QueryView query={related}>
        {(data) => (
          <dl className="grid min-h-0 flex-1 content-start gap-y-1.5 overflow-y-auto px-3 py-1.5 font-sans text-label">
            <div className="flex flex-wrap items-center gap-2">
              <dt className="text-secondary">{t('commodities.links.countries')}</dt>
              {data.countries.length === 0 ? (
                <dd className="text-secondary">—</dd>
              ) : (
                data.countries.map((country) => (
                  <dd key={country}>
                    <Link
                      to={ecoPath(WORLD_BANK_CODES[country] ?? country)}
                      className="inline-flex min-h-6 items-center border border-info/60 px-2 text-info hover:bg-info/10"
                    >
                      {format.country(country)}
                    </Link>
                  </dd>
                ))
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-2">
              <dt className="text-secondary">{t('commodities.links.securities')}</dt>
              {data.securities.length === 0 ? (
                <dd className="text-secondary">—</dd>
              ) : (
                data.securities.map((security, index) => (
                  <dd key={security.id} className="inline-flex items-center gap-x-2">
                    {index > 0 && <span aria-hidden>·</span>}
                    <Link
                      to={securityPath(security.id)}
                      title={security.name}
                      className="inline-flex min-h-6 items-center font-mono text-data hover:underline"
                    >
                      {security.code}
                    </Link>
                  </dd>
                ))
              )}
            </div>
            <div className="grid gap-1">
              <dt className="text-secondary">{t('commodities.links.news')}</dt>
              {data.news.length === 0 ? (
                <dd className="text-secondary">{t('commodities.links.noNews')}</dd>
              ) : (
                data.news.map((item) => (
                  <dd key={item.id} className="flex min-w-0 items-center gap-2">
                    <NewsTypeTag type={item.type} mode="none" />
                    <Link
                      to={newsPath(item.id)}
                      className="min-h-6 truncate leading-6 hover:underline"
                    >
                      {item.headline}
                    </Link>
                  </dd>
                ))
              )}
            </div>
          </dl>
        )}
      </QueryView>
    </Panel>
  )
}
