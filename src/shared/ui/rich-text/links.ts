/** Links the reader follows: web pages and e-mail addresses (as the API checks them). */
export const isLinkAllowed = (url: string) => /^(https?:\/\/|mailto:)/i.test(url.trim())
