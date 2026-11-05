import { expect, test, type Page } from '@playwright/test'

// MSG, the messaging of screen 11 (step 16 of ROADMAP.md): the conversations of the demo
// Analyst, K. Atangana, their requests, files, shared objects, groups and blocks. Step 17: the
// /hubs/chat hub, whose simulated people are online, read, type and answer.

const panel = (page: Page, title: string | RegExp) =>
  page.locator('section', { has: page.getByRole('heading', { name: title, exact: true }) })

const composer = (page: Page) => page.getByRole('textbox', { name: 'Message' })

const msgLink = (page: Page) =>
  page.getByRole('navigation', { name: 'Main menu' }).getByRole('link', { name: /MSG/ })

/** The prototype's account switch, from the Analyst's badge, reloads the app. */
async function switchAccount(page: Page, account: string, badge: RegExp) {
  await page.goto('/mkt')
  await page.getByRole('button', { name: /analyst/i }).click()
  await page.getByRole('menuitem', { name: account, exact: true }).click()
  await expect(page.getByRole('button', { name: badge })).toBeVisible()
}

test('the Analyst answers P. Owona, shares a security, edits then deletes a message', async ({
  page,
}) => {
  await page.goto('/mkt')
  await page
    .getByRole('navigation', { name: 'Main menu' })
    .getByRole('link', { name: /MSG/ })
    .click()
  await expect(page).toHaveURL(/\/msg$/)

  // The first conversation opens: the thread of the mockup, its bond and its files.
  const thread = panel(page, 'P. Owona · Manager')
  await expect(thread.getByText('ECMR 6.25% 29')).toBeVisible()
  await expect(thread.getByRole('link', { name: 'Open in the calculator' })).toHaveAttribute(
    'href',
    '/yas/ECMR-6.25-2029',
  )
  const participant = panel(page, 'Participant')
  await expect(participant.getByRole('heading', { name: 'P. Owona' })).toBeVisible()
  await expect(
    participant.getByRole('button', { name: 'Download courbe_cmr_oct26.xlsx' }),
  ).toBeEnabled()

  // Enter sends; the security goes as a card.
  await thread.getByRole('button', { name: 'Share a security' }).click()
  await page.getByRole('dialog').getByRole('button', { name: /^SEMC/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Add to the message' }).click()
  await composer(page).fill('The curve goes out tonight, with SEMC.')
  await composer(page).press('Enter')
  const sent = thread.getByRole('listitem').filter({ hasText: 'The curve goes out tonight' })
  await expect(sent.getByRole('img', { name: 'Sent' })).toBeVisible()
  await expect(sent.getByRole('link', { name: 'Open the profile' })).toHaveAttribute(
    'href',
    '/securities/SEMC/des',
  )
  await expect(panel(page, 'Conversations')).toContainText('You: The curve goes out tonight')

  await sent.hover()
  await sent.getByRole('button', { name: 'Edit' }).click()
  await thread
    .getByRole('textbox', { name: 'Edit the message' })
    .fill('The curve goes out tomorrow morning.')
  await thread.getByRole('button', { name: 'Save' }).click()
  const edited = thread.getByRole('listitem').filter({ hasText: 'tomorrow morning' })
  await expect(edited).toContainText('edited')
  await edited.hover()
  await edited.getByRole('button', { name: 'Delete' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
  await expect(thread.getByText('This message was deleted.')).toBeVisible()
})

test('a contact request is accepted, then answered; unread messages are read', async ({ page }) => {
  await page.goto('/msg')
  const conversations = panel(page, 'Conversations')
  await expect(conversations.getByRole('button', { name: 'Unread (1)' })).toBeVisible()
  await conversations.getByRole('button', { name: 'Requests (1)' }).click()
  await conversations.getByRole('button', { name: /B\. Eyinga/ }).click()

  const thread = panel(page, 'B. Eyinga · Student')
  await expect(thread).toContainText('B. Eyinga would like to contact you.')
  await expect(composer(page)).toBeDisabled()
  await thread.getByRole('button', { name: 'Accept' }).click()
  await expect(page.getByText('Request accepted: you can write to each other.')).toBeVisible()
  await composer(page).fill('Start with the annual reports of SEMC and SAFACAM.')
  await thread.getByRole('button', { name: 'Send' }).click()
  await expect(thread.getByText('Start with the annual reports of SEMC')).toBeVisible()
  await expect(conversations.getByRole('button', { name: 'Requests (1)' })).toHaveCount(0)

  // Opening R. Tamba's conversation reads it.
  await conversations.getByRole('button', { name: 'All', exact: true }).click()
  await conversations.getByRole('button', { name: /R\. Tamba/ }).click()
  await expect(panel(page, /^R\. Tamba · Journalist/)).toContainText('five minutes on the phone')
  await expect(conversations.getByRole('button', { name: 'Unread', exact: true })).toBeVisible()
})

test('a search finds a message and opens its conversation at it', async ({ page }) => {
  await page.goto('/msg')
  const conversations = panel(page, 'Conversations')
  await conversations.getByRole('searchbox', { name: 'Search messages' }).fill('regional market')
  await expect(conversations.getByText('1 message found')).toBeVisible()
  await conversations.getByRole('button', { name: /P\. Owona/ }).click()
  await expect(page).toHaveURL(/c=conversation-atangana&m=conversation-atangana-5/)
  await expect(page.locator('#message-conversation-atangana-5 > div')).toHaveClass(
    /border-accent-amber/,
  )
})

test('Contact in NET opens a request to a profile closed to direct messages', async ({ page }) => {
  await page.goto('/net?q=tchakounte')
  await page
    .getByRole('listitem')
    .filter({ hasText: 'A. Tchakounté' })
    .getByRole('button', { name: 'Send a contact request' })
    .click()
  await expect(page).toHaveURL(/\/msg\?to=user-tchakounte$/)
  const thread = panel(page, 'New conversation with A. Tchakounté')
  await expect(thread).toContainText('Your first message is a contact request')
  await composer(page).fill('Hello, may I ask how Insurer F invests in OTA?')
  await composer(page).press('Enter')

  await expect(page).toHaveURL(/\/msg\?c=/)
  await expect(panel(page, 'A. Tchakounté · Manager')).toContainText(
    'Your contact request waits for the answer of A. Tchakounté',
  )
  await expect(composer(page)).toBeDisabled()
  await expect(panel(page, 'Conversations')).toContainText('Request sent: “Hello, may I ask')
})

test('a file is scanned before it can be downloaded, and a virus is blocked', async ({ page }) => {
  await page.goto('/msg?c=conversation-tamba-atangana')
  const thread = panel(page, /^R\. Tamba · Journalist/)
  await page.locator('input[type=file]').setInputFiles([
    {
      name: 'cameroon-curve.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('tenor,yield\n5Y,5.85'),
    },
    { name: 'eicar-test.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') },
  ])
  await expect(thread.getByText('cameroon-curve.csv')).toBeVisible()
  await composer(page).fill('Here is the curve.')
  await thread.getByRole('button', { name: 'Send' }).click()
  const sent = thread.getByRole('listitem').filter({ hasText: 'Here is the curve.' })
  await expect(sent.getByText('Scanning…').first()).toBeVisible()
  await expect(sent.getByRole('button', { name: 'Download cameroon-curve.csv' })).toBeEnabled({
    timeout: 6_000,
  })
  await expect(sent.getByText('Blocked: a virus was found')).toBeVisible()
  await expect(panel(page, 'Participant').getByText('cameroon-curve.csv')).toBeVisible()
})

test('a group is created from New, and a block closes a conversation', async ({ page }) => {
  await page.goto('/msg')
  await panel(page, 'Conversations').getByRole('button', { name: 'New conversation' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('searchbox').fill('ndong')
  await dialog.getByRole('button', { name: 'Add M. Ndong' }).click()
  await dialog.getByRole('searchbox').fill('fotso')
  await dialog.getByRole('button', { name: 'Add L. Fotso' }).click()
  await dialog.getByLabel('Group name').fill('Research desk')
  await dialog.getByLabel('First message').fill('A desk for the analysts of the library.')
  await dialog.getByRole('button', { name: 'Create the group' }).click()
  await expect(panel(page, 'Research desk · 3 members')).toContainText(
    'A desk for the analysts of the library.',
  )
  await expect(panel(page, 'Participant')).toContainText('L. Fotso')

  await page.goto('/msg?c=conversation-atangana')
  const participant = panel(page, 'Participant')
  await participant.getByRole('button', { name: 'Block' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Block' }).click()
  await expect(panel(page, 'P. Owona · Manager')).toContainText(
    'You blocked P. Owona: the conversation is closed.',
  )
  await expect(composer(page)).toBeDisabled()

  await page.goto('/net/me')
  const blocked = panel(page, 'Visibility and contact')
  await expect(blocked).toContainText('P. Owona')
  await blocked.getByRole('button', { name: 'Unblock' }).click()
  await expect(blocked.getByText('You blocked nobody.')).toBeVisible()
})

test('in real time, K. Atangana types then answers P. Owona, and M. Ndong reads then answers', async ({
  page,
}) => {
  await switchAccount(page, 'Portfolio manager', /manager/i)
  // Away from MSG, the menu counts the unread messages and the request: 2 + 1 + 1.
  await expect(msgLink(page)).toContainText('4 unread messages or requests')
  await msgLink(page).click()

  // Screen 11: online, "typing…", then the answer, read in the open thread.
  const thread = panel(page, 'K. Atangana · Analyst · Online')
  await expect(thread.getByRole('status')).toHaveText('K. Atangana is typing…')
  await expect(thread.getByText("It will include Wednesday's 5-year OTA auction")).toBeVisible({
    timeout: 10_000,
  })
  await expect(thread.getByRole('status')).toHaveText('')
  const conversations = panel(page, 'Conversations')
  const atangana = conversations.getByRole('button', { name: /^K\. Atangana online/ })
  await expect(atangana).toContainText("It will include Wednesday's")
  await expect(atangana.getByRole('img', { name: /unread/ })).toHaveCount(0)

  // M. Ndong, online too, reads the question (✓✓), types and answers.
  await conversations.getByRole('button', { name: /^M\. Ndong online/ }).click()
  const ndong = panel(page, 'M. Ndong · Analyst · Online')
  await expect(ndong).toContainText("Gabon's budget assumes $70 a barrel")
  await composer(page).fill('Does the budget include the new oil fields?')
  await composer(page).press('Enter')
  const question = ndong.getByRole('listitem').filter({ hasText: 'the new oil fields' })
  await expect(question.getByRole('img', { name: 'Read' })).toBeVisible({ timeout: 10_000 })
  await expect(ndong.getByRole('status')).toHaveText('M. Ndong is typing…')
  await expect(ndong.getByText('after the budget debate in parliament')).toBeVisible({
    timeout: 10_000,
  })
})

test('away from MSG, the menu counts the answer of R. Tamba, who came online for it', async ({
  page,
}) => {
  await page.goto('/msg?c=conversation-tamba-atangana')
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
  await expect(msgLink(page)).toContainText('2 unread messages or requests', { timeout: 10_000 })
  await msgLink(page).click()
  await expect(conversations.getByRole('button', { name: /^R\. Tamba online/ })).toContainText(
    "Perfect, thank you. I'll call you tomorrow at 10.",
  )
})

test('a contact request reaches the Analyst half a minute after login, wherever they are', async ({
  page,
}) => {
  await page.clock.install()
  await page.goto('/mkt')
  // R. Tamba's unread message and B. Eyinga's request.
  await expect(msgLink(page)).toContainText('2 unread messages or requests')
  // The hub connects first, then the half minute passes.
  await page.clock.fastForward('00:01')
  await page.clock.fastForward('00:31')
  await expect(page.getByText('New contact request (Student): see Requests in MSG.')).toBeVisible()
  await expect(msgLink(page)).toContainText('3 unread messages or requests')
  await msgLink(page).click()
  const conversations = panel(page, 'Conversations')
  await conversations.getByRole('button', { name: 'Requests (2)' }).click()
  await expect(conversations.getByRole('button', { name: /^S\. Mvondo/ })).toContainText(
    "Contact request: “Hello, I'm writing my master's thesis on the BVMAC.",
  )
})
