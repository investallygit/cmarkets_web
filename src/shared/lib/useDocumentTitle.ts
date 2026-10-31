import { useEffect } from 'react'

const PRODUCT = 'CMarket'

/**
 * The title of the browser tab, which screen readers announce and the history and bookmarks keep
 * (WCAG 2.4.2): the page's, then the product's name unless the page already says it. Null leaves
 * the title to another component, such as the page shown in the app shell.
 */
export function useDocumentTitle(title: string | null) {
  useEffect(() => {
    if (title !== null) document.title = title.includes(PRODUCT) ? title : `${title} · ${PRODUCT}`
  }, [title])
}
