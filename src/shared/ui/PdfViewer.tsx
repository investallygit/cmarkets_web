import { useEffect, useRef } from 'react'

interface PdfViewerProps {
  /** The PDF, fetched through the API client so the request carries the user's session. */
  file: Blob
  /** Name of the frame for screen readers, e.g. the document title. */
  title: string
}

/** A PDF in the browser's own viewer, embedded in a panel (spec section 9, screen 2). */
export function PdfViewer({ file, title }: PdfViewerProps) {
  const frameRef = useRef<HTMLIFrameElement>(null)

  // The object URL lives as long as this file is shown.
  useEffect(() => {
    const url = URL.createObjectURL(file)
    if (frameRef.current) frameRef.current.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])

  return <iframe ref={frameRef} title={title} className="h-full w-full border-0 bg-panel" />
}
