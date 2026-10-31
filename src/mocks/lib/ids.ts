import { randomToken } from './auth'

/**
 * A new id such as "import-mh3k2a7f-9c41d2e8": the time, then 32 random bits. The mock writes
 * many in the same millisecond (the seeded uploads and their audit entries): a few random
 * characters alone repeated now and then, and two rows of a table shared a key.
 */
export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${randomToken(4)}`
