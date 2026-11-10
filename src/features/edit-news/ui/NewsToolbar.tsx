import { useEditorState, type Editor } from '@tiptap/react'
import { useTranslation } from 'react-i18next'
import { ToolButton } from '@/shared/ui/rich-text/ToolButton'

interface NewsToolbarProps {
  editor: Editor
  disabled: boolean
  onImage: () => void
  onSecurity: () => void
  onLink: () => void
}

/** B, I, H2, List, Quote, Table, Image, Link, CMarket security, as on the screen 13 mockup. */
export function NewsToolbar({ editor, disabled, onImage, onSecurity, onLink }: NewsToolbarProps) {
  const { t } = useTranslation()
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current.isActive('bold'),
      italic: current.isActive('italic'),
      h2: current.isActive('heading', { level: 2 }),
      list: current.isActive('bulletList'),
      quote: current.isActive('blockquote'),
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
      <ToolButton
        label={<b>B</b>}
        title={t('richText.toolbar.bold')}
        active={state.bold}
        disabled={disabled}
        onClick={() => chain().toggleBold().run()}
      />
      <ToolButton
        label={<i>I</i>}
        title={t('richText.toolbar.italic')}
        active={state.italic}
        disabled={disabled}
        onClick={() => chain().toggleItalic().run()}
      />
      <ToolButton
        label="H2"
        title={t('richText.toolbar.heading', { level: 2 })}
        active={state.h2}
        disabled={disabled}
        onClick={() => chain().toggleHeading({ level: 2 }).run()}
        className="font-semibold"
      />
      <ToolButton
        label={`• ${t('richText.toolbar.list')}`}
        title={t('richText.toolbar.list')}
        active={state.list}
        disabled={disabled}
        onClick={() => chain().toggleBulletList().run()}
      />
      <ToolButton
        label={t('richText.toolbar.quote')}
        title={t('richText.toolbar.quote')}
        active={state.quote}
        disabled={disabled}
        onClick={() => chain().toggleBlockquote().run()}
      />
      <ToolButton
        label={t('richText.toolbar.table')}
        title={t('richText.toolbar.tableHint')}
        active={state.table}
        disabled={disabled || state.table}
        onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
      />
      <ToolButton
        label={t('richText.toolbar.image')}
        title={t('newsStudio.toolbar.imageHint')}
        disabled={disabled}
        onClick={onImage}
      />
      <ToolButton
        label={t('richText.toolbar.link')}
        title={t('richText.toolbar.link')}
        active={state.link}
        disabled={disabled}
        onClick={onLink}
      />
      <ToolButton
        label={t('newsStudio.toolbar.security')}
        title={t('newsStudio.toolbar.securityHint')}
        disabled={disabled}
        onClick={onSecurity}
        className="text-accent-amber"
      />
      {state.table && !disabled && (
        <span className="ml-auto flex items-center border-l pl-1 text-secondary">
          <ToolButton
            label="+ ↓"
            title={t('richText.toolbar.addRow')}
            disabled={false}
            onClick={() => chain().addRowAfter().run()}
          />
          <ToolButton
            label="+ →"
            title={t('richText.toolbar.addColumn')}
            disabled={false}
            onClick={() => chain().addColumnAfter().run()}
          />
          <ToolButton
            label="− ↓"
            title={t('richText.toolbar.deleteRow')}
            disabled={false}
            onClick={() => chain().deleteRow().run()}
          />
          <ToolButton
            label="− →"
            title={t('richText.toolbar.deleteColumn')}
            disabled={false}
            onClick={() => chain().deleteColumn().run()}
          />
          <ToolButton
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
