import { createContext } from 'react'

/**
 * Whether data tables offer CSV and Excel export. The app shell sets it from the user's
 * permissions (no export for Students, spec section 12); a screen whose tables follow another
 * rule, such as the Admin's account list, provides its own value.
 */
export const TableExportContext = createContext(true)
