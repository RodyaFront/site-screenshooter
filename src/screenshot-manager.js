import fs from 'fs';
import { DesktopScreenshotStrategy } from './screenshot-strategies/desktop-screenshot-strategy.js';
import { MobileScreenshotStrategy } from './screenshot-strategies/mobile-screenshot-strategy.js';
import { DomFilter } from './dom-filter.js';

export class ScreenshotManager {
  constructor() {
    this.languages = ['default', 'en'];
    this.devices = ['desktop', 'mobile'];
    this.domFilter = new DomFilter();
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

      await this.domFilter.cleanPage(page);

      const fileName = strategy.generateFileName(originalUrl);
      const siteFolder = this.getSiteFolderName(originalUrl);
      const folderPath = `output/${siteFolder}/${device}/${language}`;
      const screenshotPath = `${folderPath}/${fileName}`;

      await this.ensureDirectoryExists(folderPath);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      console.log(`✅ ${device.toUpperCase()} ${language.toUpperCase()}: ${finalUrl} -> ${folderPath}/${fileName}`);

    } catch (error) {
      console.error(`❌ Помилка для ${device} ${language} ${originalUrl}:`, error.message);
    } finally {
      await page.close();
    }
  }

  getSiteFolderName(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/[^a-zA-Z0-9.-]/g, '_');
    } catch (error) {
      return 'unknown_site';
    }
  }


  async ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}
