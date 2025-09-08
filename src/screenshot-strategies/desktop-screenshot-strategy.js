import { BaseScreenshotStrategy } from './base-screenshot-strategy.js';

export class DesktopScreenshotStrategy extends BaseScreenshotStrategy {
  constructor(language) {
    super('desktop', language);
  }

  async setupPage(page) {
    await page.setViewport(this.getViewportConfig());
  }

  getViewportConfig() {
    return { width: 1450, height: 1080 };
  }

  getUserAgent() {
    return null;
  }
}
