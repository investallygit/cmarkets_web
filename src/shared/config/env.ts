import { readEnv, resolveApiPath, toApiPath } from './readEnv'

/** The addresses of the back end and the prototype mode, read from .env at build time. */
export const env = readEnv(import.meta.env)

/**
 * An image or a file the API names by its own path (a profile's photo, a publication's image),
 * on the API's origin when the site is served from another one.
 */
export const resolveApiUrl = (url: string) => resolveApiPath(url, env.apiOrigin)

/** The API's own path of an address resolveApiUrl gave, to send it back to the API. */
export const unresolveApiUrl = (url: string) => toApiPath(url, env.apiOrigin)
