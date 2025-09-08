import fs from 'fs';
import { DesktopScreenshotStrategy } from './screenshot-strategies/desktop-screenshot-strategy.js';
import { MobileScreenshotStrategy } from './screenshot-strategies/mobile-screenshot-strategy.js';

export class ScreenshotManager {
  constructor() {
    this.languages = ['default', 'en'];
    this.devices = ['desktop', 'mobile'];
  }

  createScreenshotStrategy(device, language) {
    switch (device) {
      case 'desktop':
        return new DesktopScreenshotStrategy(language);
      case 'mobile':
        return new MobileScreenshotStrategy(language);
      default:
        throw new Error(`Unknown device: ${device}`);
    }
  }

  async takeScreenshots(urls, browser) {
    const allPromises = [];

    for (const url of urls) {
      for (const language of this.languages) {
        for (const device of this.devices) {
          const promise = this.createScreenshot(browser, url, language, device);
          allPromises.push(promise);
        }
      }
    }

    await Promise.all(allPromises);
    return allPromises.length;
  }

  async createScreenshot(browser, originalUrl, language, device) {
    const page = await browser.newPage();
    const strategy = this.createScreenshotStrategy(device, language);

    try {
      await strategy.setupPage(page);

      const finalUrl = strategy.addLanguagePrefix(originalUrl);
      await page.goto(finalUrl, { waitUntil: 'networkidle2', timeout: 0 });

      const fileName = strategy.generateFileName(originalUrl);
      const folderPath = `output/${device}/${language}`;
      const screenshotPath = `${folderPath}/${fileName}`;

      await this.ensureDirectoryExists(folderPath);
      await page.screenshot({ path: screenshotPath, fullPage: true });

    } catch (error) {
      console.error(`❌ Помилка для ${device} ${language} ${originalUrl}:`, error.message);
    } finally {
      await page.close();
    }
  }


  async ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}
