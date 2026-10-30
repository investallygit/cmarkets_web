import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMarketSummary } from '@/entities/market'
import { useSecuritySearch } from '@/entities/security'
import { TextInput } from '@/shared/ui/form/TextInput'
import {
  COMPARISON_COLORS,
  comparedKey,
  MAX_COMPARISONS,
  type ComparedItem,
} from '../model/comparison'

interface CompareBarProps {
  /** The security of the chart, not offered for comparison. */
  securityId: string
  items: readonly ComparedItem[]
  onChange: (items: ComparedItem[]) => void
}

const MAX_SUGGESTIONS = 6

/** Securities and indices compared on the chart, and a search box to add one (spec section 3). */
export function CompareBar({ securityId, items, onChange }: CompareBarProps) {
  const { t } = useTranslation()
  const [text, setText] = useState('')
  const search = useSecuritySearch(text)
  const summary = useMarketSummary()

  const wanted = text.trim().toLowerCase()
  const taken = new Set(items.map(comparedKey))
  const suggestions: { item: ComparedItem; detail: string }[] = wanted
    ? [
        ...(summary.data?.indices ?? [])
          .filter(
            (index) =>
              index.code.toLowerCase().includes(wanted) ||
              index.name.toLowerCase().includes(wanted),
          )
          .map((index) => ({
            item: { kind: 'index' as const, id: index.code, label: index.name },
            detail: index.code,
          })),
        ...(search.data?.securities ?? [])
          .filter((security) => security.id !== securityId)
          .map((security) => ({
            item: { kind: 'security' as const, id: security.id, label: security.code },
            detail: security.name,
          })),
      ]
        .filter(({ item }) => !taken.has(comparedKey(item)))
        .slice(0, MAX_SUGGESTIONS)
    : []

  const add = (item: ComparedItem) => {
    onChange([...items, item])
    setText('')
  }

  return (
    <div className="flex h-9 shrink-0 items-center gap-2 border-b px-2">
      <span className="font-sans text-data text-secondary">{t('chart.compare')}</span>
      {items.map((item, index) => (
        <span
          key={comparedKey(item)}
          className="inline-flex h-6 items-center gap-1 border px-1.5 font-mono text-data"
          style={{
            borderColor: `var(${COMPARISON_COLORS[index]})`,
            color: `var(${COMPARISON_COLORS[index]})`,
          }}
        >
          {item.label}
          <button
            type="button"
            aria-label={t('chart.removeComparison', { label: item.label })}
            onClick={() => onChange(items.filter((_, at) => at !== index))}
            className="text-secondary hover:text-primary"
          >
            <X aria-hidden className="size-3" />
          </button>
        </span>
      ))}
      {items.length < MAX_COMPARISONS && (
        <div className="relative w-56">
          <TextInput
            mono
            icon={Plus}
            value={text}
            onChange={setText}
            placeholder={t('chart.comparePlaceholder')}
            aria-label={t('chart.comparePlaceholder')}
            onKeyDown={(event) => {
              const first = suggestions.at(0)
              if (event.key === 'Enter' && first) add(first.item)
              if (event.key === 'Escape') setText('')
            }}
          />
          {suggestions.length > 0 && (
            <ul className="absolute inset-x-0 top-full z-20 mt-px border bg-panel-header py-1 shadow-lg">
              {suggestions.map(({ item, detail }) => (
                <li key={comparedKey(item)}>
                  <button
                    type="button"
                    onClick={() => add(item)}
                    className="flex w-full items-baseline gap-2 px-2 py-0.5 text-left hover:bg-selected"
                  >
                    <span className="shrink-0 font-mono text-data text-accent-amber">
                      {item.label}
                    </span>
                    <span className="truncate font-sans text-data text-secondary">{detail}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
