import { clsx } from 'clsx'
import { Check, LoaderCircle } from 'lucide-react'
import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import type { ImportStatus } from '@/shared/api/contracts'

const STEPS = ['upload', 'format', 'checks', 'preview', 'publish'] as const

/** The step under way: the form, the two checks, the preview; past the last once published. */
function currentStep(status: ImportStatus | null): number {
  switch (status) {
    case null:
      return 0
    case 'format':
      return 1
    case 'checks':
      return 2
    case 'published':
      return STEPS.length
    default:
      return 3
  }
}

/** Upload → Format → Business checks → Preview → Publish (spec section 11). */
export function ImportSteps({ status }: { status: ImportStatus | null }) {
  const { t } = useTranslation()
  const current = currentStep(status)
  const running = status === 'format' || status === 'checks'
  return (
    <ol className="flex items-center gap-2 px-3 py-2.5" aria-label={t('dataImport.steps.label')}>
      {STEPS.map((step, index) => {
        const done = index < current
        const active = index === current && status !== 'discarded'
        return (
          <Fragment key={step}>
            {index > 0 && (
              <li
                aria-hidden
                className={clsx('h-px min-w-4 flex-1', index <= current ? 'bg-up' : 'bg-border')}
              />
            )}
            <li
              className="flex shrink-0 items-center gap-2"
              aria-current={active ? 'step' : undefined}
            >
              <span
                className={clsx(
                  'flex size-5 items-center justify-center rounded-full border font-mono text-caption font-semibold',
                  done && 'border-up bg-up text-app',
                  active && 'border-accent-amber bg-accent-amber text-app',
                  !done && !active && 'border-secondary text-secondary',
                )}
              >
                {done ? (
                  <Check aria-hidden className="size-3" strokeWidth={3} />
                ) : active && running ? (
                  <LoaderCircle aria-hidden className="size-3 animate-spin" />
                ) : (
                  index + 1
                )}
              </span>
              <span
                className={clsx(
                  'font-sans text-label',
                  active ? 'font-semibold text-primary' : done ? 'text-primary' : 'text-secondary',
                )}
              >
                {t(`dataImport.steps.${step}`)}
              </span>
            </li>
          </Fragment>
        )
      })}
    </ol>
  )
}
