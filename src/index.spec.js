import { endent, endent as javascript } from '@dword-design/functions';
import tester from '@dword-design/tester';
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir';
import packageName from 'depcheck-package-name';
import { execaCommand } from 'execa';
import outputFiles from 'output-files';

export default tester(
  {
    extension: {
      files: {
        dist: {
          'content.js': "document.body.classList.add('foo')",
          'manifest.json': JSON.stringify({
            content_scripts: [{ js: ['content.js'], matches: ['<all_urls>'] }],
            manifest_version: 3,
            name: 'foo',
            version: '1.0.0',
          }),
        },
        'pages/index.vue': endent`
          <template>
            <div />
          </template>
        `,
      },
      testFile: javascript`
        import tester from '${packageName`@dword-design/tester`}'
        import fs from 'fs-extra'
        import nuxtDevReady from '${packageName`nuxt-dev-ready`}'
        import { execaCommand } from 'execa'
        import kill from '${packageName`tree-kill-promise`}'
        import { endent } from '@dword-design/functions'
        import { expect } from '${packageName`expect`}'
  
        import self from '../src/index.js'
  
        export default tester(
          {
            async works() {
              const nuxt = execaCommand('${packageName`nuxt`} dev')
              await nuxtDevReady()
              try {
                await this.page.goto('http://localhost:3000')
                await new Promise(resolve => setTimeout(resolve, 2000))
                expect(await this.page.evaluate(() => [...document.body.classList])).toContain('foo')
              } finally {
                await kill(nuxt.pid)
              }
            },
          }, [
            self({ isPersistentContext: true, launchOptions: {
              args: [
                '--headless=new',
                '--load-extension=dist',
                '--disable-extensions-except=dist',
              ],
            }
          })
        ])
      `,
    },
    launchOptions: {
      test: () =>
        expect(
          execaCommand('mocha --ui exports --timeout 80000 index.spec.js'),
        ).rejects.toThrow('Timeout 1ms exceeded.'),
      testFile: endent`
        import tester from '${packageName`@dword-design/tester`}'
  
        import self from '../src/index.js'
  
        export default tester({
          works: () => {},
        }, [self({ launchOptions: { timeout: 1 } })])
  
      `,
    },
    'multiple tests': {
      testFile: endent`
        import tester from '${packageName`@dword-design/tester`}'
        import { expect } from '${packageName`expect`}'
        import nuxtDevReady from '${packageName`nuxt-dev-ready`}'
        import { execaCommand } from 'execa'
        import { endent } from '@dword-design/functions'
        import P from 'path'
        import fs from 'fs-extra'
        import kill from 'tree-kill-promise'
  
        import self from '../src/index.js'
  
        export default tester({
          async test1() {
            await this.page.goto('http://localhost:3000')
            await this.page.evaluate(() => localStorage.setItem('foo', 'bar'))
          },
          async test2() {
            await this.page.goto('http://localhost:3000')
            expect(await this.page.evaluate(() => localStorage.getItem('foo'))).toBeNull()
          },
        }, [
          {
            async before() {
              await fs.outputFile(P.join('pages', 'index.vue'), endent\`
                <template>
                  <div />
                </template>
              \`)
              this.nuxt = execaCommand('${packageName`nuxt`} dev')
              await nuxtDevReady()
            },
            async after() {
              await kill(this.nuxt.pid)
            }
          },
          self(),
        ])
  
      `,
    },
    sass: {
      testFile: endent`
        import tester from '${packageName`@dword-design/tester`}'
        import { expect } from '${packageName`expect`}'
        import outputFiles from '${packageName`output-files`}'
        import { execaCommand } from 'execa'
        import kill from 'tree-kill-promise'
        import { endent } from '@dword-design/functions'
        import nuxtDevReady from 'nuxt-dev-ready'
  
        import self from '../src/index.js'
  
        export default tester({
          async works() {
            await outputFiles({
              'assets/style.scss': endent\`
                .foo {
                  color: red;
                }

                .bar {
                  color: green;
                }
              \`,
              'nuxt.config.js': endent\`
                export default {
                  css: ['./assets/style.scss'],
                }
              \`,
              'pages/index.vue': endent\`
                <template>
                  <div class="foo" />
                </template>
              \`,
            })
            const nuxt = execaCommand('${packageName`nuxt`} dev')
            try {
              await nuxtDevReady()
              await this.page.goto('http://localhost:3000')
              const $foo = await this.page.waitForSelector('.foo', { state: 'attached' })
              expect(await $foo.evaluate(el => window.getComputedStyle(el).color)).toEqual('rgb(255, 0, 0)')
            } finally {
              await kill(nuxt.pid)
            }
          }
        }, [self()])
      `,
    },
    vue: {
      testFile: endent`
        import tester from '${packageName`@dword-design/tester`}'
        import fs from 'fs-extra'
        import { expect } from '${packageName`expect`}'
        import { execaCommand } from 'execa'
        import { endent } from '@dword-design/functions'
        import P from 'path'
        import kill from 'tree-kill-promise'
        import nuxtDevReady from 'nuxt-dev-ready'
  
        import self from '../src/index.js'
  
        export default tester({
          async works() {
            await fs.outputFile(P.join('pages', 'index.vue'), endent\`
              <template>
                <div class="foo">Hello world</div>
              </template>
            \`)
            const nuxt = execaCommand('${packageName`nuxt`} dev')
            try {
              await nuxtDevReady()
              await this.page.goto('http://localhost:3000')
              const $foo = await this.page.waitForSelector('.foo')
              expect(await $foo.evaluate(_ => _.innerText)).toEqual('Hello world')
            } finally {
              await kill(nuxt.pid)
            }
          }
        }, [self()])
      `,
    },
  },
  [
    testerPluginTmpDir(),
    {
      transform: ({
        testFile,
        files = {},
        test = () =>
          execaCommand('mocha --ui exports --timeout 80000 index.spec.js'),
      }) =>
        async function () {
          await outputFiles({ 'index.spec.js': testFile, ...files });
          await test.call(this);
        },
    },
  ],
);
