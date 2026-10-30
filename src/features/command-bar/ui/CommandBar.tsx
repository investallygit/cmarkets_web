import { useQueryClient } from '@tanstack/react-query'
import { clsx } from 'clsx'
import { CornerDownLeft, SquareTerminal, TrendingUp } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { findSecurity, useSecuritySearch } from '@/entities/security'
import { useCurrentUser } from '@/entities/session'
import type { SecuritySearchItemDto } from '@/shared/api/contracts'
import { useCurrentRoute } from '@/shared/routes/useCurrentRoute'
import { appliesToSecurity, availableFunctions, type FunctionCode } from '../config/functionCodes'
import { commandOf } from '../lib/currentCommand'
import { parseCommand } from '../lib/parseCommand'

type Suggestion =
  | { kind: 'function'; key: string; fn: FunctionCode; command: string }
  | { kind: 'security'; key: string; security: SecuritySearchItemDto }

const MAX_SUGGESTIONS = 8

/**
 * Command bar (spec section 8): a security code followed by a function code, then Enter.
 * Autocomplete from the first letter; Ctrl + K focuses it from anywhere.
 */
export function CommandBar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useCurrentUser()
  const { screen, params } = useCurrentRoute()
  const currentCommand = commandOf(screen, params)
  const inputRef = useRef<HTMLInputElement>(null)
  /** null while the bar is not being edited: it then shows the current screen's command. */
  const [draft, setDraft] = useState<string | null>(null)
  const [highlight, setHighlight] = useState(-1)
  const [error, setError] = useState<string | null>(null)
  const [picked, setPicked] = useState<SecuritySearchItemDto | null>(null)

  const functions = useMemo(() => availableFunctions(user), [user])
  const codes = useMemo(() => new Set(functions.map((fn) => fn.code)), [functions])

  const editing = draft !== null
  const text = draft ?? ''
  const tokens = text.trim().split(/\s+/).filter(Boolean)
  const endsWithSpace = text.endsWith(' ')
  const typingFirstWord = tokens.length <= 1 && !endsWithSpace
  const lastWord = endsWithSpace ? '' : (tokens.at(-1) ?? '')
  const securityPart = typingFirstWord
    ? ''
    : (endsWithSpace ? tokens : tokens.slice(0, -1)).join(' ')

  // First word: screens such as EQS or N. After a security: functions that apply to it.
  const functionMatches = editing
    ? functions.filter(
        (fn) =>
          fn.code.startsWith(lastWord) &&
          (typingFirstWord ? fn.target !== 'security' : fn.target !== 'none') &&
          (!picked || appliesToSecurity(fn, picked.type)),
      )
    : []
  const searchText = !editing
    ? ''
    : typingFirstWord
      ? lastWord
      : functionMatches.length === 0
        ? tokens.join(' ') // still typing a name with spaces, e.g. "ECMR 6.25"
        : ''
  const search = useSecuritySearch(searchText)
  const securities = searchText ? (search.data?.securities ?? []) : []

  const suggestions: Suggestion[] = [
    ...functionMatches.map((fn): Suggestion => ({
      kind: 'function',
      key: `function-${fn.code}`,
      fn,
      command: securityPart ? `${securityPart} ${fn.code}` : fn.code,
    })),
    ...securities.map((security): Suggestion => ({
      kind: 'security',
      key: `security-${security.id}`,
      security,
    })),
  ].slice(0, MAX_SUGGESTIONS)

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function reset() {
    setDraft(null)
    setHighlight(-1)
    setError(null)
    setPicked(null)
  }

  function go(path: string) {
    reset()
    inputRef.current?.blur()
    void navigate(path)
  }

  async function execute(command: string) {
    const { securityQuery, functionCode } = parseCommand(command, codes)
    if (!securityQuery && !functionCode) return
    // A security alone opens its profile.
    const code = functionCode ?? 'DES'
    const fn = functions.find((candidate) => candidate.code === code)
    if (!fn) return setError(t('shell.unknownFunction', { code }))
    if (fn.target === 'none' || (fn.target === 'optional-security' && !securityQuery)) {
      return go(fn.resolve())
    }
    if (!securityQuery) return setError(t('shell.needsSecurity', { code }))
    try {
      const security =
        picked && picked.code.toUpperCase() === securityQuery
          ? picked
          : await findSecurity(queryClient, securityQuery)
      if (!security) return setError(t('shell.unknownSecurity', { query: securityQuery }))
      if (!appliesToSecurity(fn, security.type)) {
        return setError(t('shell.notApplicable', { code, security: security.code }))
      }
      go(fn.resolve(security.id))
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure))
    }
  }

  function pickSecurity(security: SecuritySearchItemDto) {
    setPicked(security)
    setDraft(`${security.code.toUpperCase()} `)
    setHighlight(-1)
    inputRef.current?.focus()
  }

  function apply(suggestion: Suggestion) {
    if (suggestion.kind === 'security') return pickSecurity(suggestion.security)
    void execute(suggestion.command)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const count = suggestions.length
    if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && count > 0) {
      event.preventDefault()
      const step = event.key === 'ArrowDown' ? 1 : -1
      setHighlight((current) =>
        current < 0 ? (step > 0 ? 0 : count - 1) : (current + step + count) % count,
      )
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const suggestion = highlight >= 0 ? suggestions[highlight] : undefined
      if (suggestion) apply(suggestion)
      else void execute(text)
    } else if (event.key === 'Tab' && count > 0) {
      // Completes the text without running it.
      event.preventDefault()
      const suggestion = suggestions[Math.max(highlight, 0)]
      if (suggestion.kind === 'security') pickSecurity(suggestion.security)
      else setDraft(`${suggestion.command} `)
    } else if (event.key === 'Escape') {
      reset()
      inputRef.current?.blur()
    }
  }

  return (
    <div className="relative w-140 max-w-[36vw] shrink">
      <div
        className={clsx(
          'flex h-7 items-center gap-2 border bg-app px-2',
          editing ? 'border-accent-amber' : 'border-accent-amber/60',
        )}
      >
        <input
          ref={inputRef}
          role="combobox"
          aria-label={t('shell.commandLabel')}
          aria-expanded={editing && suggestions.length > 0}
          aria-controls="command-suggestions"
          aria-activedescendant={highlight >= 0 ? `command-option-${highlight}` : undefined}
          value={editing ? text : currentCommand}
          placeholder={editing ? t('shell.commandPlaceholder') : undefined}
          onFocus={() => {
            setDraft('')
            setError(null)
          }}
          onBlur={reset}
          onChange={(event) => {
            const next = event.target.value.toUpperCase()
            setDraft(next)
            setHighlight(-1)
            setError(null)
            if (picked && !next.startsWith(picked.code.toUpperCase())) setPicked(null)
          }}
          onKeyDown={onKeyDown}
          spellCheck={false}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent font-mono text-data font-semibold text-accent-amber caret-accent-amber outline-none placeholder:font-normal placeholder:text-secondary"
        />
        <button
          type="button"
          tabIndex={-1}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => void execute(text)}
          className="inline-flex items-center gap-1 font-mono text-title text-secondary hover:text-primary"
        >
          {editing && <CornerDownLeft aria-hidden className="size-3" />}
          {t('shell.go')}
        </button>
      </div>

      {editing && (suggestions.length > 0 || error) && (
        <ul
          id="command-suggestions"
          role="listbox"
          className="absolute inset-x-0 top-full z-40 mt-px border bg-panel-header py-1 shadow-lg"
        >
          {error && <li className="px-2 py-1 font-sans text-data text-down">{error}</li>}
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.key}
              id={`command-option-${index}`}
              role="option"
              aria-selected={index === highlight}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setHighlight(index)}
              onClick={() => apply(suggestion)}
              className={clsx(
                'flex h-6.5 cursor-pointer items-center gap-2 px-2',
                index === highlight && 'bg-selected',
              )}
            >
              {suggestion.kind === 'function' ? (
                <>
                  <SquareTerminal aria-hidden className="size-3.5 shrink-0 text-secondary" />
                  <span className="w-28 shrink-0 font-mono text-data font-semibold text-accent-amber">
                    {suggestion.command}
                  </span>
                  <span className="truncate font-sans text-data">{t(suggestion.fn.labelKey)}</span>
                </>
              ) : (
                <>
                  <TrendingUp aria-hidden className="size-3.5 shrink-0 text-secondary" />
                  <span className="w-28 shrink-0 truncate font-mono text-data font-semibold text-accent-amber">
                    {suggestion.security.code}
                  </span>
                  <span className="truncate font-sans text-data">{suggestion.security.name}</span>
                  <span className="ml-auto shrink-0 font-mono text-title text-secondary">
                    {suggestion.security.exchange}
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
