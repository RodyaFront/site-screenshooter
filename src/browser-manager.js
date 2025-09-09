import puppeteer from 'puppeteer';

export class BrowserManager {
  constructor() {
    this.browser = null;
  }

  async launch() {
    this.browser = await puppeteer.launch({
      headless: true
    });
    return this.browser;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  isLaunched() {
    return this.browser !== null;
  }
}
