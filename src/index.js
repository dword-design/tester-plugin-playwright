import deepmerge from 'deepmerge';
import { chromium } from 'playwright';

export default (options = {}) => {
  options = deepmerge(
    {
      isPersistentContext: false,
      launchOptions: { args: [] },
      userDataDir: '',
    },
    options,
  );

  return {
    async afterEach() {
      if (this.browser) {
        await this.page.close();
        await this.browser.close();
      }
    },
    async beforeEach() {
      this.browser = await (options.isPersistentContext
        ? chromium.launchPersistentContext(
            options.userDataDir,
            options.launchOptions,
          )
        : chromium.launch(options.launchOptions));

      this.page = await this.browser.newPage();
    },
  };
};
