import { chromium } from 'playwright';

export default (options = {}) => {
  options = { launchOptions: {}, ...options };
  return {
    async afterEach() {
      if (this.browser) {
        await this.page.close();
        await this.browser.close();
      }
    },
    async beforeEach() {
      this.browser = await chromium.launch(options.launchOptions);
      this.page = await this.browser.newPage();
    },
  };
};
