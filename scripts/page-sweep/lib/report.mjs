// The sweep's report: each page's record (results.jsonl) turned into findings, grouped by kind and
// cause, most serious first, into summary.md.
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

/** The kinds of finding, in the order the summary gives them. */
const KINDS = [
  'crash',
  'page error',
  'explore',
  'blank page',
  'access',
  '5xx',
  'sweep error',
  'panel error',
  'never-show text',
  'raw key',
  'console error',
  '4xx',
  'failed request',
  'other language',
  'number format',
  'page wider than window',
  'cut text',
  'control out of reach',
  'still loading',
  'never settled',
  'hub subscription left',
  'repeated request',
  'request while idle',
  'slow answer',
  'axe',
  'broken image',
  'link to no route',
  'console warning',
  'browser dialog',
]

const GUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi

/** An address without its ids and query: "/news/{id}". */
const shape = (url) => url.split('?')[0].replace(GUID, '{id}')

/** A message without what changes between two pages: ids, numbers, times. */
const normal = (text) =>
  text
    .replace(GUID, '{id}')
    .replace(/\d{4}-\d\d-\d\dT[\d:.]+Z?/g, '{time}')
    .replace(/\d+/g, '#')
    .slice(0, 160)

/** A 4xx the app asks for on purpose. */
function designed(record, response) {
  if (record.expect === 'missing' && [400, 404].includes(response.status)) return true
  if (response.url.startsWith('/auth/refresh') && response.status === 401) return true
  if (
    record.account === 'waiting' &&
    response.url.startsWith('/subscription') &&
    response.status === 404
  ) {
    return true
  }
  return false
}

export function findingsOf(record) {
  const found = []
  const add = (kind, cause, detail = '') =>
    found.push({
      kind,
      cause,
      detail,
      at: `${record.account} · ${record.lang} · ${record.width}`,
      path: record.path,
    })
  if (record.sweepError) add('sweep error', normal(record.sweepError), record.sweepError)
  const scan = record.scan
  if (scan) {
    if (scan.status === 'crash') add('crash', 'error boundary', record.final)
    if (scan.blank) add('blank page', 'nothing on screen', record.final)
    const expect = record.expect ?? 'page'
    if (expect === 'page' && scan.status !== 'page')
      add('access', `the page expected, ${scan.status} shown`)
    if (['forbidden', 'locked'].includes(expect) && scan.status === 'page') {
      add('access', `${expect} expected, the page shown`, record.final)
    }
    if (expect === 'locked' && scan.status === 'forbidden')
      add('access', 'locked expected, forbidden shown')
    if (expect === 'notFound' && scan.status !== 'notFound')
      add('access', `not found expected, ${scan.status} shown`)
    for (const item of scan.bad) add('never-show text', item.name, item.context)
    for (const key of scan.keys) add('raw key', key)
    for (const context of scan.numbers) add('number format', `${scan.lang} page`, context)
    for (const item of scan.mixed) add('other language', item.text, item.where)
    if (scan.overflowX > 0)
      add('page wider than window', `${record.width} px`, `by ${scan.overflowX} px`)
    for (const cut of scan.cuts)
      add('cut text', `${cut.kind} · ${cut.where}`, `"${cut.text}" by ${cut.by} px`)
    for (const item of scan.unreachable ?? [])
      add('control out of reach', `${item.kind} · ${item.where}`, item.name)
    if (scan.loading.length > 0) add('still loading', [...new Set(scan.loading)].join(', '))
    // An item that does not exist says so in its panel: that is the page working.
    if (record.expect !== 'missing')
      for (const item of scan.failed) add('panel error', item.where, item.text)
    for (const source of scan.images) add('broken image', source)
    for (const link of scan.links)
      add('link to no route', link.href, `${link.text} (${link.where})`)
  }
  if (record.settled === -1) add('never settled', 'requests or a spinner after 12 s')
  const heard = record.heard ?? {}
  for (const error of heard.errors ?? []) add('page error', normal(error.split('\n')[0]), error)
  // The browser logs each refused request: a refusal designed (above) is no finding there either.
  const refused = (heard.responses ?? []).filter((response) => response.status >= 400)
  const designedOnly = (status) => {
    const same = refused.filter((response) => response.status === status)
    return same.length > 0 && same.every((response) => designed(record, response))
  }
  for (const line of heard.console ?? []) {
    if (record.expect === 'missing' && /Conversation not found/.test(line.text)) continue
    const status = /status of (\d{3})/.exec(line.text)
    if (status && designedOnly(Number(status[1]))) continue
    add(`console ${line.type}`, normal(line.text), line.text)
  }
  const counts = new Map()
  for (const response of heard.responses ?? []) {
    const name = `${response.method} ${shape(response.url)}`
    if (response.status >= 500) add('5xx', name, `${response.status} ${response.url}`)
    else if (response.status >= 400 && !designed(record, response)) {
      add('4xx', `${name} ${response.status}`, response.url)
    }
    if (response.ms > 2000) add('slow answer', name, `${response.ms} ms`)
    if (response.idle && response.method === 'GET') add('request while idle', name, response.url)
    if (response.method === 'GET') counts.set(response.url, (counts.get(response.url) ?? 0) + 1)
  }
  for (const [url, count] of counts)
    if (count >= 3) add('repeated request', `GET ${shape(url)}`, `${count} times ${url}`)
  for (const failure of heard.failed ?? []) {
    if (!/ERR_ABORTED|NS_BINDING_ABORTED|cancelled/i.test(failure.error)) {
      add('failed request', `${failure.method} ${shape(failure.url)}`, failure.error)
    }
  }
  for (const dialog of heard.dialogs ?? []) add('browser dialog', normal(dialog), dialog)
  for (const violation of record.axe ?? []) {
    add(
      'axe',
      `${violation.id} · ${violation.help}`,
      `${violation.nodes} × ${violation.targets.join(' | ')}`,
    )
  }
  if (record.leak?.length > 0)
    add('hub subscription left', record.leak.join(', '), 'after leaving the page')
  for (const item of record.explore?.findings ?? []) {
    add('explore', `${item.control}: ${item.action}`, item.problems.join(' · '))
  }
  return found
}

export async function summarize(out) {
  const lines = (await readFile(path.join(out, 'results.jsonl'), 'utf8'))
    .split('\n')
    .filter(Boolean)
  const records = lines.map((line) => JSON.parse(line))
  const findings = records.flatMap(findingsOf)
  const groups = new Map()
  for (const finding of findings) {
    const id = `${finding.kind}\u0000${finding.cause}`
    if (!groups.has(id))
      groups.set(id, { ...finding, count: 0, where: new Set(), paths: new Set() })
    const group = groups.get(id)
    group.count += 1
    group.where.add(finding.at)
    group.paths.add(finding.path)
  }
  const sorted = [...groups.values()].sort(
    (a, b) => KINDS.indexOf(a.kind) - KINDS.indexOf(b.kind) || b.count - a.count,
  )
  const pages = new Set(records.map((record) => `${record.account} ${record.path}`)).size
  const out_ = [
    `# Page sweep`,
    '',
    `${records.length} page visits (${pages} pages × accounts), ${findings.length} findings in ${sorted.length} groups.`,
    '',
  ]
  let kind = ''
  for (const group of sorted) {
    if (group.kind !== kind) {
      kind = group.kind
      out_.push('', `## ${kind}`, '')
    }
    const list = (set, n) =>
      [...set].slice(0, n).join('; ') + (set.size > n ? `; … (${set.size})` : '')
    out_.push(`- **${group.cause}** × ${group.count}: ${group.detail.slice(0, 300)}`)
    out_.push(`  - pages: ${list(group.paths, 8)}`)
    out_.push(`  - as: ${list(group.where, 6)}`)
  }
  await writeFile(path.join(out, 'summary.md'), `${out_.join('\n')}\n`)
  await writeFile(path.join(out, 'findings.json'), JSON.stringify(findings, null, 1))
  const byKind = new Map()
  for (const group of sorted) byKind.set(group.kind, (byKind.get(group.kind) ?? 0) + 1)
  return { visits: records.length, findings: findings.length, groups: sorted.length, byKind }
}
