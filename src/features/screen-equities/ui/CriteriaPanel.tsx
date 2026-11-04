import { Plus } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSecurities } from '@/entities/security'
import { useHasPermission } from '@/entities/session'
import { ContextMenu } from '@/shared/ui/ContextMenu'
import { Button } from '@/shared/ui/form/Button'
import { Panel } from '@/shared/ui/Panel'
import {
  emptyCriterion,
  EXTRA_FIELDS,
  hasInvertedBounds,
  toRequestCriteria,
  type CriterionState,
} from '../model/criteria'
import { useScreenerStore } from '../model/screenerStore'
import { CriterionField } from './CriterionField'
import { SavedScreens } from './SavedScreens'
import { SaveScreenDialog } from './SaveScreenDialog'

const NO_SECTORS: string[] = []

/**
 * Screen 3, criteria: drop-downs and ranges, active ones with an amber border; Run sends
 * POST /analysis/screener, SAVE keeps the criteria under a name (/analysis/screens).
 */
export function CriteriaPanel() {
  const { t } = useTranslation()
  const draft = useScreenerStore((state) => state.draft)
  const applied = useScreenerStore((state) => state.applied)
  const screenId = useScreenerStore((state) => state.screenId)
  const { setDraft, run, reset, load } = useScreenerStore.getState()
  // "Read" accounts (Journalist, CEO) screen without saving (spec section 12).
  const canSave = useHasPermission('analysis:save')
  const [saving, setSaving] = useState(false)
  const addRef = useRef<HTMLButtonElement>(null)
  const [addMenu, setAddMenu] = useState<{ x: number; y: number } | null>(null)
  const closeAddMenu = useCallback(() => setAddMenu(null), [])

  const market = draft.find((criterion) => criterion.field === 'market')
  const marketCode = market && 'value' in market ? market.value : ''
  const equities = useSecurities({ type: 'equity', market: marketCode || undefined })
  const sectors = useMemo(
    () =>
      equities.data
        ? [...new Set(equities.data.map((security) => security.sector))].sort()
        : NO_SECTORS,
    [equities.data],
  )

  const requestCriteria = toRequestCriteria(draft)
  const changed = JSON.stringify(requestCriteria) !== JSON.stringify(applied)
  const inverted = draft.some(hasInvertedBounds)
  const addable = EXTRA_FIELDS.filter((field) => !draft.some((other) => other.field === field))
  const update = (next: CriterionState) =>
    setDraft(draft.map((criterion) => (criterion.field === next.field ? next : criterion)))

  return (
    <Panel
      title={t('screener.criteria')}
      code="EQS"
      options={
        canSave && (
          <button
            type="button"
            onClick={() => setSaving(true)}
            className="panel-no-drag uppercase hover:text-primary"
          >
            {t('screener.save')}
          </button>
        )
      }
      bodyClassName="flex flex-col"
    >
      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(event) => {
          event.preventDefault()
          if (!inverted) run()
        }}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-2">
          {draft.map((criterion) => (
            <CriterionField
              key={criterion.field}
              criterion={criterion}
              sectors={sectors}
              onChange={update}
              onRemove={
                EXTRA_FIELDS.some((field) => field === criterion.field)
                  ? () => setDraft(draft.filter((other) => other !== criterion))
                  : undefined
              }
            />
          ))}
          <button
            ref={addRef}
            type="button"
            disabled={addable.length === 0}
            aria-haspopup="menu"
            aria-expanded={addMenu !== null}
            onClick={(event) => {
              if (addMenu) return closeAddMenu()
              const rect = event.currentTarget.getBoundingClientRect()
              setAddMenu({ x: rect.left, y: rect.bottom + 4 })
            }}
            className="mt-1 inline-flex h-7 shrink-0 items-center justify-center gap-1 border font-sans text-data text-info enabled:hover:bg-info/10 disabled:text-secondary"
          >
            <Plus aria-hidden className="size-3.5" />
            {t('screener.addCriterion')}
          </button>
        </div>
        <div className="flex shrink-0 flex-col gap-2 border-t p-2">
          <div className="grid grid-cols-2 gap-2">
            <Button type="submit" variant="primary" size="lg" disabled={inverted}>
              {t('screener.run')}
            </Button>
            <Button size="lg" onClick={reset}>
              {t('screener.reset')}
            </Button>
          </div>
          {changed && !inverted && (
            <p className="font-sans text-title text-warning">{t('screener.notRun')}</p>
          )}
          {canSave && <SavedScreens loadedId={screenId} onLoad={load} />}
        </div>
      </form>
      {addMenu && (
        <ContextMenu
          x={addMenu.x}
          y={addMenu.y}
          items={addable.map((field) => ({
            id: field,
            label: t(`screener.fields.${field}`),
            onSelect: () => setDraft([...draft, emptyCriterion(field)]),
          }))}
          onClose={closeAddMenu}
          ignoreRef={addRef}
        />
      )}
      <SaveScreenDialog
        open={canSave && saving}
        onClose={() => setSaving(false)}
        criteria={requestCriteria}
        onSaved={(screen) => useScreenerStore.setState({ screenId: screen.id })}
      />
    </Panel>
  )
}
