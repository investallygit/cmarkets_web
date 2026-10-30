/** Extensions of an accept list such as ".csv,.xlsx". */
function extensionsOf(accept: string): string[] {
  return accept
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.startsWith('.'))
}

/** Whether the file name ends with an extension of the accept list. */
export function isAccepted(fileName: string, accept: string): boolean {
  const name = fileName.toLowerCase()
  return extensionsOf(accept).some((extension) => name.endsWith(extension))
}

/** ".csv,.xlsx" -> "CSV, XLSX", for the hint under a file drop zone. */
export function describeAccept(accept: string): string {
  return extensionsOf(accept)
    .map((extension) => extension.slice(1).toUpperCase())
    .join(', ')
}
