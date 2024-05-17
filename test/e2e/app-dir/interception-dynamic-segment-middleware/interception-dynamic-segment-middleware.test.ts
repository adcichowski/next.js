import { nextTestSetup } from 'e2e-utils'
import { retry } from 'next-test-utils'

describe('interception-dynamic-segment-middleware', () => {
  const { next } = nextTestSetup({
    files: __dirname,
  })

  it('should work when interception route is paired with a dynamic segment & middleware', async () => {
    const browser = await next.browser('/')

    await browser.elementByCss('[href="/foo/p/1"]').click()
    await retry(async () => {
      expect(await browser.elementById('modal').text()).toMatch(/intercepted/)
    })
    await browser.refresh()
    await retry(async () => {
      expect(await browser.elementById('modal').text()).toEqual('')
    })
    await retry(async () => {
      expect(await browser.elementById('children').text()).toMatch(
        /not intercepted/
      )
    })
  })
})
