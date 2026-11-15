import { composer, panel } from './msg.js'
import { expect, test } from './people.js'

// MSG for the SVT (ROADMAP step 48, decision 16): B. Sima, Bank E's SVT, writes from TRD to
// T. Bekale, a trader whose link Bank E confirmed, who reads it live and answers; "+ NEW" offers
// B. Sima Bank E's linked traders only, one person at a time; T. Bekale finds B. Sima among the
// SVTs of the trader's links, which the directory does not list. The flow makes a conversation of
// its own.

const SIMA = 'b.sima@bank-e.example'
const BEKALE = 't.bekale@bank.example'

test('B. Sima writes to T. Bekale from TRD, who answers live', async ({ person }) => {
  // T. Bekale online, MSG open.
  const bekale = await person(BEKALE)
  await bekale.goto('/msg')
  await expect(panel(bekale, 'Conversations')).toBeVisible()

  // B. Sima: MSG in the menu; TRD's linked trader picked, "Write to T. Bekale".
  const sima = await person(SIMA)
  const menu = sima.getByRole('navigation', { name: 'Main menu' })
  await expect(menu.getByRole('link')).toHaveText([/^SVT/, /^TRD/, /^AGR/, /^MSG/, /^N/, /^CFG/])
  await menu.getByRole('link', { name: /^TRD/ }).click()
  const linked = panel(sima, /^Trader links/).getByRole('region', { name: 'Linked traders' })
  await linked.getByRole('row', { name: /T\. Bekale/ }).click()
  await linked.getByRole('link', { name: 'Write to T. Bekale' }).click()
  await expect(sima).toHaveURL(/\/msg\?to=/)

  // The new conversation: T. Bekale's organisation, no profile to open (an SVT reads none).
  const thread = panel(sima, 'New conversation with T. Bekale')
  await expect(thread.getByText('Your first message opens the conversation.')).toBeVisible()
  const card = panel(sima, 'Participant')
  await expect(card).toContainText('Bank C')
  await expect(card.getByRole('link', { name: 'View profile' })).toHaveCount(0)
  await composer(sima).fill('ACC-0012 waits for Bank D: I tell you when it is approved.')
  await composer(sima).press('Enter')
  await expect(sima).toHaveURL(/\/msg\?c=/)
  const withBekale = panel(sima, /^T\. Bekale · Trader/)
  await expect(withBekale.getByText('ACC-0012 waits for Bank D')).toBeVisible()
  // Nobody to block for an SVT, which reports a conversation instead.
  await expect(card.getByRole('button', { name: /^Block/ })).toHaveCount(0)
  await expect(card.getByRole('button', { name: /^Report/ })).toBeVisible()

  // T. Bekale reads it at once: B. Sima of Bank E, an SVT without a profile; answers.
  const row = panel(bekale, 'Conversations').getByRole('button', { name: /^B\. Sima/ })
  await expect(row).toContainText('ACC-0012 waits for Bank D')
  await row.click()
  const withSima = panel(bekale, /^B\. Sima · SVT/)
  await expect(withSima.getByText('ACC-0012 waits for Bank D')).toBeVisible()
  const simaCard = panel(bekale, 'Participant')
  await expect(simaCard).toContainText('Bank E')
  await expect(simaCard.getByRole('link', { name: 'View profile' })).toHaveCount(0)
  await composer(bekale).fill('Thank you, I wait for it.')
  await composer(bekale).press('Enter')
  await expect(withBekale.getByText('Thank you, I wait for it.')).toBeVisible()

  // B. Sima's "+ NEW": Bank E's linked traders, by name; one chosen, nobody more joins.
  await panel(sima, 'Conversations').getByRole('button', { name: 'New conversation' }).click()
  const dialog = sima.getByRole('dialog', { name: 'New conversation' })
  const people = dialog.getByRole('button', { name: /^Add / })
  await expect(people).toHaveText([/A\. Tchakounté/, /B\. Ngoma/, /C\. Abena/, /T\. Bekale/])
  await dialog.getByRole('searchbox').fill('pension')
  await expect(people).toHaveText([/B\. Ngoma\s*Pension fund G/])
  await dialog.getByRole('button', { name: 'Add B. Ngoma' }).click()
  await dialog.getByRole('searchbox').fill('')
  await expect(
    dialog.getByText('An SVT writes to each of its linked traders one to one'),
  ).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Add C. Abena' })).toBeDisabled()
  await dialog.getByRole('button', { name: 'Cancel' }).click()

  // T. Bekale's "+ NEW" finds B. Sima, out of the directory, and opens their conversation.
  await panel(bekale, 'Conversations').getByRole('button', { name: 'New conversation' }).click()
  const theirs = bekale.getByRole('dialog', { name: 'New conversation' })
  await theirs.getByRole('searchbox').fill('sima')
  // The contacts of its links come first, before any card of the directory the search finds.
  await expect(theirs.getByRole('button', { name: /^Add / }).first()).toHaveText(
    /B\. Sima\s*Bank E/,
  )
  await theirs.getByRole('button', { name: 'Add B. Sima' }).click()
  await theirs.getByRole('button', { name: 'Continue' }).click()
  await expect(bekale).toHaveURL(/\/msg\?c=/)
  await expect(withSima.getByText('Thank you, I wait for it.')).toBeVisible()

  // B. Sima's CFG: no subscription nor invoices, an SVT paying no plan; Bank E's members.
  await menu.getByRole('link', { name: /^CFG/ }).click()
  await expect(panel(sima, 'Organisation')).toContainText('Bank E')
  await expect(sima.getByRole('heading', { name: 'Subscription', exact: true })).toHaveCount(0)
  await expect(sima.getByRole('heading', { name: 'Invoices', exact: true })).toHaveCount(0)
})
