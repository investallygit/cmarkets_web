/** A new id such as "import-mh3k2a7f1c": the time, then a few random characters. */
export const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`
