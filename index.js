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

    const domainGroups = this.urlReader.groupUrlsByDomain(rawUrls);

    const domainsForAuto = this.urlReader.getDomainsForAutoDiscovery(domainGroups);

    for (const [domain, urls] of Object.entries(domainGroups)) {
      const domainInfo = domainsForAuto.find(d => d.domain === domain);

      if (domainInfo) {
        Logger.search(`Авто-визначення для домена ${domain} (${domainInfo.baseUrl})...`);
        const discoveredUrls = await this.autoDiscoverer.discoverUrls(domainInfo.baseUrl);
        processedUrls.push(...discoveredUrls);
      } else {
        Logger.info(`Обробка домена ${domain} без авто-визначення...`);
        processedUrls.push(...urls);
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
