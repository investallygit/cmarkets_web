import { demoId } from './demoIds.js'
import { composer, panel } from './msg.js'
import { expect, test } from './people.js'

// MSG, the messaging of screen 11 (step 16 of ROADMAP.md): the conversations of the demo
// Analyst, K. Atangana, their requests, files, shared objects, groups and blocks. The hub between
// two sessions (step 17): messaging-realtime.spec.ts.

// @fresh-db: the conversations as seeded, P. Owona's first: other flows start newer ones.
test(
  'the Analyst answers P. Owona, shares a security, edits then deletes a message',
  { tag: '@fresh-db' },
  async ({ page }) => {
    await page.goto('/mkt')
    await page
      .getByRole('navigation', { name: 'Main menu' })
      .getByRole('link', { name: /MSG/ })
      .click()
    await expect(page).toHaveURL(/\/msg$/)

    // The first conversation opens: the thread of the mockup, its bond and its files.
    const thread = panel(page, 'P. Owona · Manager')
    await expect(thread.getByText('ECMR 6.25% 29')).toBeVisible()
    await expect(thread.getByRole('link', { name: 'Open in bond pricing' })).toHaveAttribute(
      'href',
      '/bp/ECMR-6.25-2029',
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
  },
)

test('a contact request is accepted, then answered; unread messages are read', async ({
  page,
  person,
}) => {
  // B. Eyinga waits for the answer, her thread open.
  const eyinga = await person('b.eyinga@university.example')
  await eyinga.goto(`/msg?c=${demoId('conversation-eyinga')}`)
  const sent = panel(eyinga, /^K\. Atangana · Analyst/)
  await expect(sent).toContainText('Your contact request waits for the answer of K. Atangana')
  await expect(composer(eyinga)).toBeDisabled()

  await page.goto('/msg')
  const conversations = panel(page, 'Conversations')
  await expect(conversations.getByRole('button', { name: 'Unread (1)' })).toBeVisible()
  await conversations.getByRole('button', { name: 'Requests (1)' }).click()
  await conversations.getByRole('button', { name: /B\. Eyinga/ }).click()

  const thread = panel(page, /^B\. Eyinga · Student/)
  await expect(thread).toContainText('B. Eyinga would like to contact you.')
  await expect(composer(page)).toBeDisabled()
  await thread.getByRole('button', { name: 'Accept' }).click()
  await expect(page.getByText('Request accepted: you can write to each other.')).toBeVisible()
  // Her thread opens at once, without a reload.
  await expect(sent).not.toContainText('Your contact request waits')
  await expect(composer(eyinga)).toBeEnabled()
  await composer(page).fill('Start with the annual reports of SEMC and SAFACAM.')
  await thread.getByRole('button', { name: 'Send' }).click()
  await expect(thread.getByText('Start with the annual reports of SEMC')).toBeVisible()
  await expect(sent.getByText('Start with the annual reports of SEMC')).toBeVisible()
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
  await expect(page).toHaveURL(
    new RegExp(`c=${demoId('conversation-atangana')}&m=${demoId('conversation-atangana-5')}`),
  )
  await expect(page.locator(`#message-${demoId('conversation-atangana-5')} > div`)).toHaveClass(
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
  await expect(page).toHaveURL(new RegExp(`/msg\\?to=${demoId('user-tchakounte')}$`))
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
  await page.goto(`/msg?c=${demoId('conversation-tamba-atangana')}`)
  const thread = panel(page, /^R\. Tamba · Journalist/)
  await page.locator('input[type=file]').setInputFiles([
    {
      name: 'cameroon-curve.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('tenor,yield\n5Y,5.85'),
    },
    // Infected by the EICAR marker it holds, for CMarket.Api's scanner.
    {
      name: 'eicar-test.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\n% EICAR-STANDARD-ANTIVIRUS-TEST-FILE'),
    },
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

test('seven files chosen at once: the five of a message go up, the others are left', async ({
  page,
}) => {
  await page.goto(`/msg?c=${demoId('conversation-tamba-atangana')}`)
  const thread = panel(page, /^R\. Tamba · Journalist/)
  const uploads: string[] = []
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().endsWith('/api/v1/attachments')) {
      uploads.push(request.url())
    }
  })
  await page.locator('input[type=file]').setInputFiles(
    Array.from({ length: 7 }, (_, index) => ({
      name: `rows-${index + 1}.csv`,
      mimeType: 'text/csv',
      buffer: Buffer.from(`tenor,yield\n${index + 1}Y,5.8`),
    })),
  )
  await expect(thread.getByRole('alert')).toHaveText('5 files at most.')
  await expect(thread.getByRole('listitem').filter({ hasText: /^rows-\d\.csv/ })).toHaveCount(5)
  await expect(thread.getByRole('button', { name: 'File' })).toBeDisabled()
  await expect.poll(() => uploads.length).toBe(5)
  await expect(thread.getByText('rows-6.csv')).toHaveCount(0)
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

  await page.goto(`/msg?c=${demoId('conversation-atangana')}`)
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
