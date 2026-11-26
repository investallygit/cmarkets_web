import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import type { RfqCompletionDto } from '@/shared/api/contracts'
import { COMPLETION_TEXT, completionTone, formatCompletion } from '../lib/completion'

/**
 * A completion ratio as screen 22 writes it (sixth version; ROADMAP decision 52): "96% (48)" in
 * green, amber or red, "New (3)" in grey; without the cases on the board ("93%"). Its title says
 * what it counts, for a pointer and a screen reader.
 */
export function CompletionRatio({
  completion,
  withCases = true,
  className,
}: {
  completion: RfqCompletionDto | null
  withCases?: boolean
  className?: string
}) {
  const { t } = useTranslation()
  if (!completion) return <span className="text-secondary">–</span>
  const text = formatCompletion(
    completion,
    {
      percent: (percent) => t('rfqCompletion.percent', { percent }),
      withCases: (percent, cases) => t('rfqCompletion.percentCases', { percent, cases }),
      newcomer: (cases) => t('rfqCompletion.new', { count: cases }),
    },
    withCases,
  )
  return (
    <span
      title={t('rfqCompletion.ratioTitle', { count: completion.cases })}
      className={clsx(
        'font-mono tabular-nums',
        COMPLETION_TEXT[completionTone(completion)],
        className,
      )}
    >
      {text}
    </span>
  )
}
