import { useEditorState, type Editor } from '@tiptap/react'
import { useTranslation } from 'react-i18next'
import { ToolButton as Tool } from '@/shared/ui/rich-text/ToolButton'

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
      aria-label={t('richText.toolbar.label')}
      className="flex shrink-0 flex-wrap items-center gap-x-1 border-b bg-panel-header px-1"
    >
      <Tool
        label={<b>B</b>}
        title={t('richText.toolbar.bold')}
        active={state.bold}
        disabled={disabled}
        onClick={() => chain().toggleBold().run()}
      />
      <Tool
        label={<i>I</i>}
        title={t('richText.toolbar.italic')}
        active={state.italic}
        disabled={disabled}
        onClick={() => chain().toggleItalic().run()}
      />
      <Tool
        label="H2"
        title={t('richText.toolbar.heading', { level: 2 })}
        active={state.h2}
        disabled={disabled}
        onClick={() => chain().toggleHeading({ level: 2 }).run()}
        className="font-semibold"
      />
      <Tool
        label="H3"
        title={t('richText.toolbar.heading', { level: 3 })}
        active={state.h3}
        disabled={disabled}
        onClick={() => chain().toggleHeading({ level: 3 }).run()}
        className="font-semibold"
      />
      <Tool
        label={`• ${t('richText.toolbar.list')}`}
        title={t('richText.toolbar.list')}
        active={state.list}
        disabled={disabled}
        onClick={() => chain().toggleBulletList().run()}
      />
      <Tool
        label={t('richText.toolbar.table')}
        title={t('richText.toolbar.tableHint')}
        active={state.table}
        disabled={disabled || state.table}
        onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
      />
      <Tool
        label={t('richText.toolbar.image')}
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
        label={t('richText.toolbar.link')}
        title={t('richText.toolbar.link')}
        active={state.link}
        disabled={disabled}
        onClick={onLink}
      />
      {state.table && !disabled && (
        <span className="ml-auto flex items-center border-l pl-1 text-secondary">
          <Tool
            label="+ ↓"
            title={t('richText.toolbar.addRow')}
            disabled={false}
            onClick={() => chain().addRowAfter().run()}
          />
          <Tool
            label="+ →"
            title={t('richText.toolbar.addColumn')}
            disabled={false}
            onClick={() => chain().addColumnAfter().run()}
          />
          <Tool
            label="− ↓"
            title={t('richText.toolbar.deleteRow')}
            disabled={false}
            onClick={() => chain().deleteRow().run()}
          />
          <Tool
            label="− →"
            title={t('richText.toolbar.deleteColumn')}
            disabled={false}
            onClick={() => chain().deleteColumn().run()}
          />
          <Tool
            label="×"
            title={t('richText.toolbar.deleteTable')}
            disabled={false}
            onClick={() => chain().deleteTable().run()}
          />
        </span>
      )}
    </div>
  )
}
