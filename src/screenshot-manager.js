import fs from 'fs';

export class ScreenshotManager {
  constructor() {
    this.languages = ['default', 'en'];
    this.devices = ['desktop', 'mobile'];
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

    try {
      await this.setupPage(page, device);

      const finalUrl = this.addLanguagePrefix(originalUrl, language);
      await page.goto(finalUrl, { waitUntil: 'networkidle2', timeout: 0 });

      const fileName = this.generateFileName(originalUrl, device, language);
      const folderPath = `output/${device}/${language}`;
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

  async setupPage(page, device) {
    if (device === 'mobile') {
      await page.setViewport({
        width: 375,
        height: 667,
        deviceScaleFactor: 2,
        isMobile: true
      });
      await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1');
    } else {
      await page.setViewport({ width: 1450, height: 1080 });
    }
  }

  addLanguagePrefix(url, language) {
    if (language === 'default') {
      return url;
    }

    if (language === 'en') {
      const urlObj = new URL(url);
      const path = urlObj.pathname;

      if (path.startsWith('/en/')) {
        return url;
      }

      if (path === '/') {
        urlObj.pathname = '/en/';
      } else {
        urlObj.pathname = '/en' + path;
      }

      return urlObj.toString();
    }

    return url;
  }

  generateFileName(url, device, language) {
    try {
      const urlObj = new URL(url);
      let pathname = urlObj.pathname;

      pathname = pathname.replace(/^\/+|\/+$/g, '');

      if (!pathname) {
        return `${device}_${language}_home.png`;
      }

      const cleanName = pathname
        .replace(/\//g, '_')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');

      return `${device}_${language}_${cleanName}.png`;
    } catch (error) {
      return `${device}_${language}_page.png`;
    }
  }

  async ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}
