import fs from 'fs';
import path from 'path';
import { BrowserManager } from './browser.js';
import { AutoParser } from './auto-parser.js';

export class ScreenshotManager {
  constructor(outputDir = './output') {
    this.browserManager = new BrowserManager();
    this.autoParser = new AutoParser();
    this.outputDir = outputDir;
    this.results = [];
  }

  async takeScreenshots(urls, options = {}) {
    const defaultOptions = {
      retryCount: 3,
      retryDelay: 2000,
      parallel: false
    };

    const finalOptions = { ...defaultOptions, ...options };

    await this.ensureOutputDir();
    await this.browserManager.launch();

    let lastDevice = null;

    try {
      for (const urlInfo of urls) {
        if (lastDevice && lastDevice !== urlInfo.device) {
          console.log(`🔄 Перемикаємося з ${lastDevice} на ${urlInfo.device} - повна очистка та перезапуск браузера`);
          await this.browserManager.fullCleanup();
          await this.browserManager.launch();
          console.log(`✅ Браузер перезапущено з новим User Agent для ${urlInfo.device}`);
        }

        lastDevice = urlInfo.device;
        await this.processUrl(urlInfo, finalOptions);
      }
    } finally {
      await this.browserManager.fullCleanup();
    }

    return this.results;
  }

  async processUrl(urlInfo, options) {
    const { url, language, device, pageType, siteName, viewport, baseUrl } = urlInfo;

    if (url === 'auto') return await this.navigateToTargetPage(urlInfo, options);

    const urlWithQuery = this.browserManager.addVersionQuery(url, device);
    console.log(`🔗 Обробляємо URL: ${urlWithQuery} (${siteName}/${language}/${device}/${pageType})`);

    let attempts = 0;
    let success = false;
    let error = null;

    while (attempts < options.retryCount && !success) {
      attempts++;

      try {
        await this.browserManager.createPage(device);
        await this.browserManager.setViewport(viewport);
        await this.browserManager.navigateToUrl(urlWithQuery, device);

        const fileName = this.generateFilePath(siteName, language, device, pageType);
        await this.ensureDirectoryExists(path.dirname(fileName));
        await this.browserManager.takeScreenshot(fileName);
        await this.browserManager.closePage();

        success = true;

        this.results.push({
          success: true,
          siteName,
          language,
          device,
          pageType,
          url,
          fileName,
          attempts
        });

      } catch (err) {
        error = err;

        if (this.browserManager.hasPage()) {
          await this.browserManager.closePage();
        }

        if (attempts < options.retryCount) {
          await this.delay(options.retryDelay);
        }
      }
    }

    if (!success) {
      this.results.push({
        success: false,
        siteName,
        language,
        device,
        pageType,
        url,
        error: error.message,
        attempts
      });
    }
  }

  generateFilePath(siteName, language, device, pageType) {
    const fileName = `${pageType}.png`;
    return path.join(this.outputDir, siteName, language, device, fileName);
  }

  async ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStats() {
    const total = this.results.length;
    const successful = this.results.filter(r => r.success).length;
    const failed = total - successful;

    const bySite = {};
    this.results.forEach(result => {
      if (!bySite[result.siteName]) {
        bySite[result.siteName] = { total: 0, successful: 0, failed: 0 };
      }
      bySite[result.siteName].total++;
      if (result.success) {
        bySite[result.siteName].successful++;
      } else {
        bySite[result.siteName].failed++;
      }
    });

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total * 100).toFixed(1) : 0,
      bySite
    };
  }

  getErrors() {
    return this.results
      .filter(r => !r.success)
      .map(r => ({
        site: r.siteName,
        language: r.language,
        device: r.device,
        page: r.pageType,
        url: r.url,
        error: r.error,
        attempts: r.attempts
      }));
  }

  getSuccessful() {
    return this.results
      .filter(r => r.success)
      .map(r => ({
        site: r.siteName,
        language: r.language,
        device: r.device,
        page: r.pageType,
        url: r.url,
        fileName: r.fileName,
        attempts: r.attempts
      }));
  }

  clearResults() {
    this.results = [];
  }

  async navigateToTargetPage(urlInfo, options) {
    const { language, device, pageType, siteName, viewport, baseUrl } = urlInfo;

    console.log(`🤖 Автоматичне визначення ${pageType} для ${siteName}/${language}/${device}`);

    if (pageType === 'category') {
      return await this.navigateToAutoCategory(urlInfo, options);
    } else if (pageType === 'product') {
      return await this.navigateToAutoProduct(urlInfo, options);
    } else {
      throw new Error(`Невідомий тип сторінки для авто-визначення: ${pageType}`);
    }
  }

  async navigateToAutoCategory(urlInfo, options) {
    const { language, device, pageType, siteName, viewport, baseUrl } = urlInfo;

    let attempts = 0;
    let success = false;
    let error = null;

    while (attempts < options.retryCount && !success) {
      attempts++;

      try {
        await this.browserManager.createPage(device);
        await this.browserManager.setViewport(viewport);

        const homeUrl = this.autoParser.processUrl(baseUrl, language, device);
        console.log(`🏠 Переходимо на головну сторінку: ${homeUrl}`);
        await this.browserManager.navigateToUrl(baseUrl, device);

        const categoryUrl = await this.autoParser.findCategoryFromMenu(
          this.browserManager.page,
          baseUrl,
          device
        );

        if (!categoryUrl) {
          throw new Error('Не вдалося знайти категорію в меню');
        }

        const categoryUrlWithQuery = this.autoParser.processUrl(categoryUrl, language, device);
        console.log(`📂 Переходимо на категорію: ${categoryUrlWithQuery}`);
        await this.browserManager.navigateToUrl(categoryUrlWithQuery, device);

        const fileName = this.generateFilePath(siteName, language, device, pageType);
        await this.ensureDirectoryExists(path.dirname(fileName));
        await this.browserManager.takeScreenshot(fileName);
        await this.browserManager.closePage();

        success = true;

        this.results.push({
          success: true,
          siteName,
          language,
          device,
          pageType,
          url: categoryUrl,
          fileName,
          attempts
        });

      } catch (err) {
        error = err;
        console.error(`❌ Помилка авто-визначення категорії (спроба ${attempts}): ${err.message}`);

        if (this.browserManager.hasPage()) {
          await this.browserManager.closePage();
        }

        if (attempts < options.retryCount) {
          await this.delay(options.retryDelay);
        }
      }
    }

    if (!success) {
      this.results.push({
        success: false,
        siteName,
        language,
        device,
        pageType,
        url: 'auto',
        error: error.message,
        attempts
      });
    }
  }

  async navigateToAutoProduct(urlInfo, options) {
    const { language, device, pageType, siteName, viewport, baseUrl } = urlInfo;

    let attempts = 0;
    let success = false;
    let error = null;

    while (attempts < options.retryCount && !success) {
      attempts++;

      try {
        await this.browserManager.createPage(device);
        await this.browserManager.setViewport(viewport);

        const homeUrl = this.autoParser.processUrl(baseUrl, language, device);
        console.log(`🏠 Переходимо на головну сторінку: ${homeUrl}`);
        await this.browserManager.navigateToUrl(baseUrl, device);

        const categoryUrl = await this.autoParser.findCategoryFromMenu(
          this.browserManager.page,
          baseUrl,
          device
        );

        if (!categoryUrl) {
          throw new Error('Не вдалося знайти категорію в меню');
        }

        const categoryUrlWithQuery = this.autoParser.processUrl(categoryUrl, language, device);
        console.log(`📂 Переходимо на категорію: ${categoryUrlWithQuery}`);
        await this.browserManager.navigateToUrl(categoryUrlWithQuery, device);

        const productUrl = await this.autoParser.findFirstProductFromCategory(
          this.browserManager.page,
          baseUrl
        );

        if (!productUrl) {
          throw new Error('Не вдалося знайти товар на сторінці категорії');
        }

        const productUrlWithQuery = this.autoParser.processUrl(productUrl, language, device);
        console.log(`🛍️ Переходимо на товар: ${productUrlWithQuery}`);
        await this.browserManager.navigateToUrl(productUrlWithQuery, device);

        const fileName = this.generateFilePath(siteName, language, device, pageType);
        await this.ensureDirectoryExists(path.dirname(fileName));
        await this.browserManager.takeScreenshot(fileName);
        await this.browserManager.closePage();

        success = true;

        this.results.push({
          success: true,
          siteName,
          language,
          device,
          pageType,
          url: productUrl,
          fileName,
          attempts
        });

      } catch (err) {
        error = err;
        console.error(`❌ Помилка авто-визначення товару (спроба ${attempts}): ${err.message}`);

        if (this.browserManager.hasPage()) {
          await this.browserManager.closePage();
        }

        if (attempts < options.retryCount) {
          await this.delay(options.retryDelay);
        }
      }
    }

    if (!success) {
      this.results.push({
        success: false,
        siteName,
        language,
        device,
        pageType,
        url: 'auto',
        error: error.message,
        attempts
      });
    }
  }
}
