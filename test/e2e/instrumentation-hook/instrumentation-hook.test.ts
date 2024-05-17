import { nextTestSetup } from 'e2e-utils'
import { retry } from 'next-test-utils'
import path from 'path'

const describeCase = (
  caseName: string,
  callback: (context: ReturnType<typeof nextTestSetup>) => void
) => {
  describe(caseName, () => {
    const context = nextTestSetup({
      files: path.join(__dirname, caseName),
      skipDeployment: true,
    })
    if (context.skipped) return

    callback(context)
  })
}
describe('Instrumentation Hook', () => {
  // TODO: investigate the failure with esm import
  // createNextDescribe(
  //   'with-esm-import',
  //   {
  //     files: path.join(__dirname, 'with-esm-import'),
  //     nextConfig: {
  //       experimental: {
  //         instrumentationHook: true,
  //       },
  //     },
  //     dependencies: {
  //       // This test is mostly for compatibility with this package
  //       '@vercel/otel': 'latest',
  //     },
  //     skipDeployment: true,
  //   },
  //   ({ next }) => {
  // eslint-disable-next-line jest/no-commented-out-tests
  //     it('with-esm-import should run the instrumentation hook', async () => {
  //       await next.render('/')
  //       await check(
  //         () => next.cliOutput,
  //         /register in instrumentation\.js is running/
  //       )
  //     })
  //   }
  // )

  describeCase('with-middleware', ({ next }) => {
    it('with-middleware should run the instrumentation hook', async () => {
      await next.render('/')
      await retry(async () => {
        expect(await next.cliOutput).toMatch(/instrumentation hook on the edge/)
      })
    })
  })

  describeCase('with-edge-api', ({ next }) => {
    it('with-edge-api should run the instrumentation hook', async () => {
      await next.render('/api')
      await retry(async () => {
        expect(await next.cliOutput).toMatch(/instrumentation hook on the edge/)
      })
    })
  })

  describeCase('with-edge-page', ({ next }) => {
    it('with-edge-page should run the instrumentation hook', async () => {
      await next.render('/')
      await retry(async () => {
        expect(await next.cliOutput).toMatch(/instrumentation hook on the edge/)
      })
    })
  })

  describeCase('with-node-api', ({ next }) => {
    it('with-node-api should run the instrumentation hook', async () => {
      await retry(async () => {
        expect(await next.cliOutput).toMatch(/instrumentation hook on nodejs/)
      })
    })
  })

  describeCase('with-node-page', ({ next }) => {
    it('with-node-page should run the instrumentation hook', async () => {
      await retry(async () => {
        expect(await next.cliOutput).toMatch(/instrumentation hook on nodejs/)
      })
    })
  })

  describeCase('with-async-node-page', ({ next }) => {
    it('with-async-node-page should run the instrumentation hook', async () => {
      const page = await next.render('/')
      expect(page).toContain('Node - finished: true')
    })
  })

  describeCase('with-async-edge-page', ({ next }) => {
    it('with-async-edge-page should run the instrumentation hook', async () => {
      const page = await next.render('/')
      expect(page).toContain('Edge - finished: true')
    })
  })

  describeCase('general', ({ next, isNextDev }) => {
    it('should not overlap with a instrumentation page', async () => {
      const page = await next.render('/instrumentation')
      expect(page).toContain('Hello')
    })
    if (isNextDev) {
      // TODO: Implement handling for changing the instrument file.
      it.skip('should reload the server when the instrumentation hook changes', async () => {
        await next.render('/')
        await next.patchFile(
          './instrumentation.js',
          `export function register() {console.log('toast')}`
        )
        await retry(async () => {
          expect(await next.cliOutput).toMatch(/toast/)
        })
        await next.renameFile(
          './instrumentation.js',
          './instrumentation.js.bak'
        )
        await retry(async () => {
          expect(await next.cliOutput).toMatch(
            /The instrumentation file has been removed/
          )
        })
        await next.patchFile(
          './instrumentation.js.bak',
          `export function register() {console.log('bread')}`
        )
        await next.renameFile(
          './instrumentation.js.bak',
          './instrumentation.js'
        )
        await retry(async () => {
          expect(await next.cliOutput).toMatch(
            /The instrumentation file was added/
          )
        })
        await retry(async () => {
          expect(await next.cliOutput).toMatch(/bread/)
        })
      })
    }
  })
})
