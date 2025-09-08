import { BaseScreenshotStrategy } from './base-screenshot-strategy.js';

export class MobileScreenshotStrategy extends BaseScreenshotStrategy {
  constructor(language) {
    super('mobile', language);
  }

  async setupPage(page) {
    await page.setViewport(this.getViewportConfig());
    await page.setUserAgent(this.getUserAgent());
  }

  getViewportConfig() {
    return {
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
      isMobile: true
    };
  }

  getUserAgent() {
    return 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1';
  }
}
