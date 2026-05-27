import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async (text: string) => {
          ;(window as unknown as { __copiedText: string }).__copiedText = text
        },
      },
      configurable: true,
    })
  })
})

test('compares lists, copies, downloads, and keeps processing local', async ({ page }) => {
  await page.goto('/')

  const runtimeRequests: string[] = []
  page.on('request', (request) => {
    runtimeRequests.push(request.url())
  })

  await expect(page.getByText('This utility is based on')).toBeVisible()
  await expect(page.getByText('Browser only')).toHaveCount(0)

  await page.locator('#list-a').fill('apple\nbanana')
  await page.locator('#list-b').fill('apple\nbanana')
  const relationshipNotice = page.locator('.relationship-notice')
  await expect(relationshipNotice).toHaveText(
    'Lists A and B are exactly the same: identical items in the same order.',
  )
  await expect
    .poll(() =>
      relationshipNotice.evaluate((notice) => {
        const inputGrid = document.querySelector('.input-grid')
        return inputGrid
          ? Boolean(notice.compareDocumentPosition(inputGrid) & Node.DOCUMENT_POSITION_FOLLOWING)
          : false
      }),
    )
    .toBe(true)

  await page.locator('#list-a').fill('apple\nbanana\nbanana\n')
  await page.locator('#list-b').fill('banana\ncarrot')

  await expect(page.getByRole('region', { name: 'A Only' })).toContainText('apple')

  await page.getByRole('button', { name: /In Both/ }).click()
  await expect(page.getByRole('region', { name: 'In Both' })).toContainText('banana')

  await page.getByRole('button', { name: /B Only/ }).click()
  await expect(page.getByRole('region', { name: 'B Only' })).toContainText('carrot')

  await page.getByRole('button', { name: 'Copy' }).click()
  await expect.poll(() => page.evaluate(() => (window as unknown as { __copiedText: string }).__copiedText)).toBe('carrot')

  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect((await download).suggestedFilename()).toBe('bOnly.txt')

  await page.getByRole('button', { name: 'To A' }).click()
  await expect(page.locator('#list-a')).toHaveValue('carrot')
  expect(runtimeRequests).toEqual([])
})

test('counts text and reveals hidden characters', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Character Counter' }).click()
  await page.getByPlaceholder('Paste text to count').fill('Hello world\n🙂')
  await expect(page.getByText('13')).toBeVisible()
  await expect(page.getByText('UTF-8 bytes').locator('..')).toContainText('16')

  await page.getByRole('button', { name: 'Reveal Hidden Characters' }).click()
  await page.getByPlaceholder('Paste text with hidden characters').fill('a b\tc')
  await expect(page.getByText('a·b⇥c')).toBeVisible()

  await page.getByRole('button', { name: 'Compare Two Lists' }).click()
  await expect(page.locator('#list-a')).toBeVisible()
})
