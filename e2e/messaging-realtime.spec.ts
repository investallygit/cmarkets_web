import { demoId } from './demoIds.js'
import { composer, msgLink, panel, switchAccount } from './msg.js'
import { apiAs, expect, test } from './people.js'

// MSG in real time (step 17 of ROADMAP.md): the /hubs/chat hub between two sessions, the test's
// page and the people `person()` logs in beside it, who type, answer, read, ask and are taken
// out of a group. The flows tagged @fresh-db count the conversations as seeded: run this spec
// alone on a fresh database (E2E_FRESH_DB=1), they first.

const ANALYST = 'k.atangana@analyst.example'
const NDONG = 'm.ndong@ndong-research.example'
const FOTSO = 'l.fotso@agri-research.example'

/** What the flows read of a conversation or a message the API created. */
type Created = { id: string }

test(
  'in real time, K. Atangana types then answers P. Owona, and M. Ndong reads then answers',
  { tag: '@fresh-db' },
  async ({ page, person }) => {
    // The Analyst online, P. Owona's thread on screen; P. Owona on this page.
    const atangana = await person(ANALYST)
    await atangana.goto(`/msg?c=${demoId('conversation-atangana')}`)
    await expect(composer(atangana)).toBeEnabled()
    await switchAccount(page, 'Portfolio manager', /manager/i)
    // Away from MSG, the menu counts the unread messages and the request: 2 + 1 + 1.
    await expect(msgLink(page)).toContainText('4 unread messages or requests')
    await msgLink(page).click()

    // Screen 11: online, "typing…", then the answer, read in the open thread.
    const thread = panel(page, 'K. Atangana · Analyst · Online')
    await expect(thread).toBeVisible()
    await composer(atangana).fill("It will include Wednesday's 5-year OTA auction.")
    await expect(thread.getByRole('status')).toHaveText('K. Atangana is typing…')
    await composer(atangana).press('Enter')
    await expect(thread.getByText("It will include Wednesday's 5-year OTA auction")).toBeVisible()
    await expect(thread.getByRole('status')).toHaveText('')
    const conversations = panel(page, 'Conversations')
    const row = conversations.getByRole('button', { name: /^K\. Atangana online/ })
    await expect(row).toContainText("It will include Wednesday's")
    await expect(row.getByRole('img', { name: /unread/ })).toHaveCount(0)

    // M. Ndong, online with the thread open, reads the question (✓✓), types and answers.
    const ndong = await person(NDONG)
    await ndong.goto(`/msg?c=${demoId('conversation-ndong')}`)
    await expect(composer(ndong)).toBeEnabled()
    await conversations.getByRole('button', { name: /^M\. Ndong online/ }).click()
    const theirs = panel(page, 'M. Ndong · Analyst · Online')
    await expect(theirs).toContainText("Gabon's budget assumes $70 a barrel")
    await composer(page).fill('Does the budget include the new oil fields?')
    await composer(page).press('Enter')
    const question = theirs.getByRole('listitem').filter({ hasText: 'the new oil fields' })
    await expect(question.getByRole('img', { name: 'Read' })).toBeVisible()
    await composer(ndong).fill('Not yet: they come after the budget debate in parliament.')
    await expect(theirs.getByRole('status')).toHaveText('M. Ndong is typing…')
    await composer(ndong).press('Enter')
    await expect(theirs.getByText('after the budget debate in parliament')).toBeVisible()
  },
)

test(
  'away from MSG, the menu counts the answer of R. Tamba, who came online for it',
  { tag: '@fresh-db' },
  async ({ page, person }) => {
    await page.goto(`/msg?c=${demoId('conversation-tamba-atangana')}`)
    const conversations = panel(page, 'Conversations')
    // Opening the thread reads it: B. Eyinga's request is all that waits.
    await expect(conversations.getByRole('button', { name: 'Unread', exact: true })).toBeVisible()
    await composer(page).fill('Yes, tomorrow at 10 suits me.')
    await composer(page).press('Enter')
    await expect(panel(page, /^R\. Tamba · Journalist/)).toContainText('tomorrow at 10 suits me')

    await page
      .getByRole('navigation', { name: 'Main menu' })
      .getByRole('link', { name: /MKT/ })
      .click()
    await expect(msgLink(page)).toContainText('1 unread message or request')
    const tamba = await person('r.tamba@press.example')
    await tamba.goto(`/msg?c=${demoId('conversation-tamba-atangana')}`)
    await composer(tamba).fill("Perfect, thank you. I'll call you tomorrow at 10.")
    await composer(tamba).press('Enter')
    await expect(msgLink(page)).toContainText('2 unread messages or requests')
    await msgLink(page).click()
    await expect(conversations.getByRole('button', { name: /^R\. Tamba online/ })).toContainText(
      "Perfect, thank you. I'll call you tomorrow at 10.",
    )
  },
)

test(
  'a contact request reaches the Analyst wherever they are',
  { tag: '@fresh-db' },
  async ({ page, person }) => {
    await page.goto('/mkt')
    // R. Tamba's unread message and B. Eyinga's request.
    await expect(msgLink(page)).toContainText('2 unread messages or requests')
    const mvondo = await person('s.mvondo@university.example')
    await mvondo.goto(`/msg?to=${demoId('user-analyst')}`)
    await expect(panel(mvondo, 'New conversation with K. Atangana')).toContainText(
      'Your first message is a contact request',
    )
    await composer(mvondo).fill(
      "Hello, I'm writing my master's thesis on the BVMAC. May I ask you three questions?",
    )
    await composer(mvondo).press('Enter')

    await expect(
      page.getByText('New contact request (Student): see Requests in MSG.'),
    ).toBeVisible()
    await expect(msgLink(page)).toContainText('3 unread messages or requests')
    await msgLink(page).click()
    const conversations = panel(page, 'Conversations')
    await conversations.getByRole('button', { name: 'Requests (2)' }).click()
    await expect(conversations.getByRole('button', { name: /^S\. Mvondo/ })).toContainText(
      "Contact request: “Hello, I'm writing my master's thesis on the BVMAC.",
    )
  },
)

test('a member taken out of a group reads it closed at once, and nobody typing any more', async ({
  page,
  person,
}) => {
  const api = await apiAs(page)
  const group = await api<Created>('POST', '/conversations', {
    participantIds: [demoId('user-ndong'), demoId('user-fotso')],
    title: 'Removal desk',
    message: { text: 'Welcome to the desk.' },
  })
  const ndong = await person(NDONG)
  const fotso = await person(FOTSO)
  await ndong.goto(`/msg?c=${group.id}`)
  await fotso.goto(`/msg?c=${group.id}`)
  await expect(composer(ndong)).toBeEnabled()
  await expect(composer(fotso)).toBeEnabled()
  await page.goto(`/msg?c=${group.id}`)

  // A member reads "typing…", then the message.
  await composer(page).fill('The desk meets on Monday.')
  await expect(ndong.getByText('K. Atangana is typing…')).toBeVisible()
  await composer(page).press('Enter')
  await expect(ndong.getByText('The desk meets on Monday.')).toBeVisible()

  // Taken out: their open thread closes at once, without a reload.
  await panel(page, 'Participant')
    .getByRole('button', { name: 'Take M. Ndong out of the group' })
    .click()
  await expect(panel(page, 'Removal desk · 2 members')).toBeVisible()
  await expect(ndong.getByText('You are no longer a member of this group.')).toBeVisible()
  await expect(composer(ndong)).toBeDisabled()

  // The composer sends Typing every 2.5 s at most: the next one reaches L. Fotso only.
  await page.waitForTimeout(2_600)
  await composer(page).fill('Without M. Ndong from now on.')
  await expect(fotso.getByText('K. Atangana is typing…')).toBeVisible()
  await expect(ndong.getByText('K. Atangana is typing…')).toHaveCount(0)
})

test('a search opens a message older than the 50 the thread loads first', async ({ page }) => {
  const api = await apiAs(page)
  const group = await api<Created>('POST', '/conversations', {
    participantIds: [demoId('user-ndong'), demoId('user-fotso')],
    title: 'Archive desk',
    message: { text: 'The archive starts here.' },
  })
  // A word no other message holds, then 55 messages after it.
  const word = Array.from({ length: 10 }, () =>
    String.fromCharCode(97 + Math.floor(Math.random() * 26)),
  ).join('')
  const marker = await api<Created>('POST', `/conversations/${group.id}/messages`, {
    text: `The ${word} memo is in the files.`,
  })
  for (let index = 1; index <= 55; index++) {
    await api('POST', `/conversations/${group.id}/messages`, { text: `Note ${index}` })
  }

  await page.goto('/msg')
  const conversations = panel(page, 'Conversations')
  await conversations.getByRole('searchbox', { name: 'Search messages' }).fill(word)
  await expect(conversations.getByText('1 message found')).toBeVisible()
  await conversations.getByRole('button', { name: /Archive desk/ }).click()
  await expect(page).toHaveURL(new RegExp(`c=${group.id}&m=${marker.id}`))
  // The older page loads, and the message shows framed.
  const found = page.locator(`#message-${marker.id}`)
  await expect(found.locator('> div')).toHaveClass(/border-accent-amber/)
  await expect(found).toBeInViewport()
})
