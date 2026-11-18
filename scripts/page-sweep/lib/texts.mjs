// The app's strings, read from its locale files: the translation keys (a key on screen is a missing
// string), the strings of one language only (English left on a French page, or the reverse) and the
// status pages' messages. Given to every page by an init script.
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

function flatten(object, prefix, out) {
  for (const [key, value] of Object.entries(object)) {
    const name = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object') flatten(value, name, out)
    else out.set(name, String(value))
  }
  return out
}

async function readLanguage(webRoot, language) {
  const directory = path.join(webRoot, 'src/shared/i18n/locales', language)
  const strings = new Map()
  for (const file of (await readdir(directory)).filter((name) => name.endsWith('.json'))) {
    flatten(JSON.parse(await readFile(path.join(directory, file), 'utf8')), '', strings)
  }
  return strings
}

/** A string worth looking for as a whole text on screen: words, no placeholder, no markup. */
const usable = (text) =>
  text.length >= 4 && /[a-zA-Z]{3}/.test(text) && !/\{\{|<\/?\w|\$t\(/.test(text)

/** A pattern for a message with placeholders: "The {{module}} module…" matches any module. */
const pattern = (text) =>
  `^${text
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\\\{\\\{\w+\\\}\\\}/g, '.+')
    .trim()}$`

export async function loadTexts(webRoot) {
  const en = await readLanguage(webRoot, 'en')
  const fr = await readLanguage(webRoot, 'fr')
  // i18next's plural keys (count_one, count_other) are written in t() without their suffix.
  const keys = new Set(
    [...en.keys()].flatMap((key) => [key, key.replace(/_(zero|one|two|few|many|other)$/, '')]),
  )
  const enValues = new Set([...en.values()].map((value) => value.trim()))
  const frValues = new Set([...fr.values()].map((value) => value.trim()))
  const only = (values, others) =>
    [...values].filter((value) => usable(value) && !others.has(value))
  const status = (key) => [en.get(key), fr.get(key)].filter(Boolean).map(pattern)
  const sweep = {
    keys: [...keys],
    enOnly: only(enValues, frValues),
    frOnly: only(frValues, enValues),
    status: {
      notFound: status('status.notFound'),
      forbidden: status('status.forbidden'),
      crash: status('status.unexpected'),
      locked: status('subscription.locked.title'),
    },
    loading: [en.get('common.loading'), fr.get('common.loading')],
    noData: [en.get('common.noData'), fr.get('common.noData')],
    retry: [en.get('common.retry'), fr.get('common.retry')],
    mainMenu: [en.get('shell.mainMenu'), fr.get('shell.mainMenu')].filter(Boolean),
  }
  const initScript = `window.__SWEEP__ = (() => {
    const data = ${JSON.stringify(sweep)};
    return { ...data, keys: new Set(data.keys), enOnly: new Set(data.enOnly), frOnly: new Set(data.frOnly) };
  })();`
  return { ...sweep, initScript }
}
