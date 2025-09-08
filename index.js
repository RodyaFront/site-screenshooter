import { UrlReader } from './src/url-reader.js';
import { AutoDiscoverer } from './src/auto-discoverer.js';
import { ScreenshotManager } from './src/screenshot-manager.js';
import { BrowserManager } from './src/browser-manager.js';
import { Logger } from './src/logger.js';

class ScreenshotApp {
  constructor() {
    this.urlReader = new UrlReader();
    this.autoDiscoverer = new AutoDiscoverer();
    this.screenshotManager = new ScreenshotManager();
    this.browserManager = new BrowserManager();
  }

  async processUrls() {
    const rawUrls = this.urlReader.readUrls();
    const processedUrls = [];

    if (this.urlReader.hasOnlyRootUrl(rawUrls)) {
      Logger.search(`Авто-визначення для ${rawUrls[0]}...`);
      const discoveredUrls = await this.autoDiscoverer.discoverUrls(rawUrls[0]);
      processedUrls.push(...discoveredUrls);
    } else {
      for (const url of rawUrls) {
        if (url === 'auto') {
          const baseUrl = this.urlReader.findBaseUrlForAuto(rawUrls);
          if (baseUrl) {
            Logger.search(`Авто-визначення для ${baseUrl}...`);
            const discoveredUrls = await this.autoDiscoverer.discoverUrls(baseUrl);
            processedUrls.push(...discoveredUrls);
          } else {
            Logger.error('Не знайдено базовий URL для авто-визначення');
          }
        } else {
          processedUrls.push(url);
        }
      }
    }

    return processedUrls;
  }

  async run() {
    try {
      const urls = await this.processUrls();

      Logger.list(`Знайдено ${urls.length} URL для обробки:`);
      console.log('');

      await this.browserManager.launch();
      const screenshotCount = await this.screenshotManager.takeScreenshots(urls, this.browserManager.browser);

      Logger.celebration(`Всі ${screenshotCount} скриншоти успішно створені!`);

    } catch (error) {
      Logger.error(`Помилка: ${error.message}`);
    } finally {
      await this.browserManager.close();
    }
  }
}

const app = new ScreenshotApp();
app.run();
