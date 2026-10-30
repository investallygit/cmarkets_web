import { initialsOf } from '../lib/initials'

export function AnalystAvatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      className="flex size-11 shrink-0 items-center justify-center rounded-full border bg-panel-header font-mono text-figure font-semibold text-accent-amber"
    >
      {initialsOf(name)}
    </span>
  )
}
