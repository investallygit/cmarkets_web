import { useEditorState, type Editor } from '@tiptap/react'
import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface ToolProps {
  label: ReactNode
  /** Spoken and shown on hover when the label is a symbol. */
  title: string
  active?: boolean
  disabled: boolean
  onClick: () => void
  className?: string
}

function Tool({ label, title, active = false, disabled, onClick, className }: ToolProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      // The selection stays in the text while a button is pressed.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={clsx(
        'h-7 px-2 font-sans text-data disabled:opacity-40',
        active ? 'text-accent-amber' : 'hover:text-accent-amber',
        className,
      )}
    >
      {label}
    </button>
  )
}

interface EditorToolbarProps {
  editor: Editor
  disabled: boolean
  onImage: () => void
  onChart: () => void
  onLink: () => void
}

/** B, I, H2, H3, List, Table, Image, CMarket chart and Link, as on the screen 7 mockup. */
export function EditorToolbar({ editor, disabled, onImage, onChart, onLink }: EditorToolbarProps) {
  const { t } = useTranslation()
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current.isActive('bold'),
      italic: current.isActive('italic'),
      h2: current.isActive('heading', { level: 2 }),
      h3: current.isActive('heading', { level: 3 }),
      list: current.isActive('bulletList'),
      table: current.isActive('table'),
      link: current.isActive('link'),
    }),
  })
  const chain = () => editor.chain().focus()

  return (
    <div
      role="toolbar"
      aria-label={t('studio.toolbar.label')}
      className="flex shrink-0 flex-wrap items-center gap-x-1 border-b bg-panel-header px-1"
    >
      <Tool
        label={<b>B</b>}
        title={t('studio.toolbar.bold')}
        active={state.bold}
        disabled={disabled}
        onClick={() => chain().toggleBold().run()}
      />
      <Tool
        label={<i>I</i>}
        title={t('studio.toolbar.italic')}
        active={state.italic}
        disabled={disabled}
        onClick={() => chain().toggleItalic().run()}
      />
      <Tool
        label="H2"
        title={t('studio.toolbar.heading', { level: 2 })}
        active={state.h2}
        disabled={disabled}
        onClick={() => chain().toggleHeading({ level: 2 }).run()}
        className="font-semibold"
      />
      <Tool
        label="H3"
        title={t('studio.toolbar.heading', { level: 3 })}
        active={state.h3}
        disabled={disabled}
        onClick={() => chain().toggleHeading({ level: 3 }).run()}
        className="font-semibold"
      />
      <Tool
        label={`• ${t('studio.toolbar.list')}`}
        title={t('studio.toolbar.list')}
        active={state.list}
        disabled={disabled}
        onClick={() => chain().toggleBulletList().run()}
      />
      <Tool
        label={t('studio.toolbar.table')}
        title={t('studio.toolbar.tableHint')}
        active={state.table}
        disabled={disabled || state.table}
        onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
      />
      <Tool
        label={t('studio.toolbar.image')}
        title={t('studio.toolbar.imageHint')}
        disabled={disabled}
        onClick={onImage}
      />
      <Tool
        label={t('studio.toolbar.chart')}
        title={t('studio.toolbar.chartHint')}
        disabled={disabled}
        onClick={onChart}
        className="text-accent-amber"
      />
      <Tool
        label={t('studio.toolbar.link')}
        title={t('studio.toolbar.link')}
        active={state.link}
        disabled={disabled}
        onClick={onLink}
      />
      {state.table && !disabled && (
        <span className="ml-auto flex items-center border-l pl-1 text-secondary">
          <Tool
            label="+ ↓"
            title={t('studio.toolbar.addRow')}
            disabled={false}
            onClick={() => chain().addRowAfter().run()}
          />
          <Tool
            label="+ →"
            title={t('studio.toolbar.addColumn')}
            disabled={false}
            onClick={() => chain().addColumnAfter().run()}
          />
          <Tool
            label="− ↓"
            title={t('studio.toolbar.deleteRow')}
            disabled={false}
            onClick={() => chain().deleteRow().run()}
          />
          <Tool
            label="− →"
            title={t('studio.toolbar.deleteColumn')}
            disabled={false}
            onClick={() => chain().deleteColumn().run()}
          />
          <Tool
            label="×"
            title={t('studio.toolbar.deleteTable')}
            disabled={false}
            onClick={() => chain().deleteTable().run()}
          />
        </span>
      )}
    </div>
  )
}
