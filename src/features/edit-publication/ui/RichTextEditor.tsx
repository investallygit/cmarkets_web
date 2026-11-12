import { EditorContent, useEditor } from '@tiptap/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUploadAttachment } from '@/entities/publication'
import type { FrozenChartDto, RichTextDoc } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { CHART_NODE } from '@/shared/lib/richText'
import { LinkDialog } from '@/shared/ui/rich-text/LinkDialog'
import { toast } from '@/shared/ui/toast'
import { useDraftStore } from '../model/draftStore'
import { ChartDialog } from './ChartDialog'
import { FrozenChartsContext } from './chartsContext'
import { EditorToolbar } from './EditorToolbar'
import { editorExtensions } from './editorExtensions'

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
const MAX_IMAGE_SIZE = 2 * 1024 * 1024

const saveBody = (body: RichTextDoc) => useDraftStore.getState().edit({ body })

interface RichTextEditorProps {
  publicationId: string
  /** Read when the editor starts: it then holds the text (key it to start again). */
  content: RichTextDoc
  charts: readonly FrozenChartDto[]
  editable: boolean
  /** The company of the publication, offered first for a chart. */
  security: { id: string; code: string } | null
  'aria-describedby'?: string
}

/**
 * TipTap editor of the studio (spec section 7): text, tables, images uploaded as attachments and
 * CMarket charts frozen at insertion. Each change goes to the draft, which the autosave sends.
 */
export function RichTextEditor({
  publicationId,
  content,
  charts,
  editable,
  security,
  'aria-describedby': describedBy,
}: RichTextEditorProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const upload = useUploadAttachment(publicationId)
  const imageInput = useRef<HTMLInputElement>(null)
  const [dialog, setDialog] = useState<'chart' | 'link' | null>(null)
  const extensions = useMemo(() => editorExtensions(t('studio.editor.placeholder')), [t])
  const editor = useEditor({
    extensions,
    content,
    editable,
    editorProps: {
      attributes: {
        class: 'publication-text min-h-full px-3 py-2',
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': t('studio.editor.body'),
        ...(describedBy && { 'aria-describedby': describedBy }),
      },
    },
    onUpdate: ({ editor: current }) => saveBody(current.getJSON() as RichTextDoc),
  })
  useEffect(() => {
    // Without an update event: that would count as a change of the text.
    if (editor.isEditable !== editable) editor.setEditable(editable, false)
  }, [editor, editable])
  const byId = useMemo(() => new Map(charts.map((chart) => [chart.id, chart])), [charts])

  const insertImage = (file: File) => {
    if (!IMAGE_TYPES.includes(file.type)) {
      toast.error(t('studio.image.type', { name: file.name }))
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error(
        t('studio.image.size', { name: file.name, size: format.fileSize(MAX_IMAGE_SIZE) }),
      )
      return
    }
    upload.mutate(file, {
      onSuccess: (image) =>
        editor.chain().focus().setImage({ src: image.url, alt: image.fileName }).run(),
      onError: (error) => toast.error(error.message),
    })
  }

  return (
    <FrozenChartsContext.Provider value={byId}>
      {/* The text shows its focus as a field does: TipTap's own outline is off (index.css). */}
      <div className="flex min-h-60 flex-1 flex-col border has-[.ProseMirror:focus-visible]:border-accent-amber has-[.ProseMirror:focus-visible]:ring-1 has-[.ProseMirror:focus-visible]:ring-accent-amber/40">
        <EditorToolbar
          editor={editor}
          disabled={!editable}
          onImage={() => imageInput.current?.click()}
          onChart={() => setDialog('chart')}
          onLink={() => setDialog('link')}
        />
        <EditorContent editor={editor} className="min-h-0 flex-1 overflow-auto" />
      </div>
      <input
        ref={imageInput}
        type="file"
        accept={IMAGE_TYPES.join(',')}
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) insertImage(file)
        }}
      />
      <ChartDialog
        open={dialog === 'chart'}
        onClose={() => setDialog(null)}
        publicationId={publicationId}
        security={security}
        onInsert={(chart) =>
          editor
            .chain()
            .focus()
            .insertContent({ type: CHART_NODE, attrs: { chartId: chart.id } })
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
    </FrozenChartsContext.Provider>
  )
}
