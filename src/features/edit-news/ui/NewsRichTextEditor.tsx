import { EditorContent, useEditor } from '@tiptap/react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SECURITY_CARD_NODE, type RichTextDoc } from '@/shared/api/contracts'
import { LinkDialog } from '@/shared/ui/rich-text/LinkDialog'
import { useNewsDraftStore } from '../model/newsDraftStore'
import { ImageDialog } from './ImageDialog'
import { newsExtensions } from './newsExtensions'
import { NewsToolbar } from './NewsToolbar'
import { SecurityCardDialog } from './SecurityCardDialog'

const saveBody = (body: RichTextDoc) => useNewsDraftStore.getState().edit({ body })

interface NewsRichTextEditorProps {
  newsId: string
  /** Read when the editor starts: it then holds the text (key it to start again). */
  content: RichTextDoc | null
  editable: boolean
  'aria-describedby'?: string
}

/**
 * TipTap editor of an ARTICLE's body (spec section 16): text, subheadings, lists, quotes, tables,
 * images uploaded with their credit, links and CMarket security cards. Each change goes to the
 * working copy, which the autosave sends.
 */
export function NewsRichTextEditor({
  newsId,
  content,
  editable,
  'aria-describedby': describedBy,
}: NewsRichTextEditorProps) {
  const { t } = useTranslation()
  const [dialog, setDialog] = useState<'image' | 'security' | 'link' | null>(null)
  const extensions = useMemo(() => newsExtensions(t('newsStudio.editor.placeholder')), [t])
  const editor = useEditor({
    extensions,
    content: content ?? undefined,
    editable,
    editorProps: {
      attributes: {
        class: 'publication-text min-h-full px-3 py-2',
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': t('newsStudio.editor.body'),
        ...(describedBy && { 'aria-describedby': describedBy }),
      },
    },
    onUpdate: ({ editor: current }) => saveBody(current.getJSON() as RichTextDoc),
  })
  useEffect(() => {
    // Without an update event: that would count as a change of the text.
    if (editor.isEditable !== editable) editor.setEditable(editable, false)
  }, [editor, editable])

  return (
    <>
      <div className="flex min-h-60 flex-1 flex-col border">
        <NewsToolbar
          editor={editor}
          disabled={!editable}
          onImage={() => setDialog('image')}
          onSecurity={() => setDialog('security')}
          onLink={() => setDialog('link')}
        />
        <EditorContent editor={editor} className="min-h-0 flex-1 overflow-auto" />
      </div>
      <ImageDialog
        open={dialog === 'image'}
        onClose={() => setDialog(null)}
        newsId={newsId}
        onInsert={(image) =>
          editor
            .chain()
            .focus()
            .insertContent({
              type: 'image',
              attrs: { src: image.url, alt: image.fileName, credit: image.credit },
            })
            .run()
        }
      />
      <SecurityCardDialog
        open={dialog === 'security'}
        onClose={() => setDialog(null)}
        onInsert={(security) =>
          editor
            .chain()
            .focus()
            .insertContent({
              type: SECURITY_CARD_NODE,
              attrs: { securityId: security.id, code: security.code },
            })
            .run()
        }
      />
      <LinkDialog
        open={dialog === 'link'}
        onClose={() => setDialog(null)}
        href={String(editor.getAttributes('link').href ?? '')}
        onSave={(href) => {
          const link = editor.chain().focus().extendMarkRange('link')
          if (href) link.setLink({ href }).run()
          else link.unsetLink().run()
        }}
      />
    </>
  )
}
