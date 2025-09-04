import fs from 'fs';
import path from 'path';
import { BrowserManager } from './browser.js';

export class ScreenshotManager {
  constructor(outputDir = './output') {
    this.browserManager = new BrowserManager();
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
          console.log(`🔄 Перемикаємося з ${lastDevice} на ${urlInfo.device} - перезапускаємо браузер`);
          await this.browserManager.close();
          await this.browserManager.launch();
        }

        lastDevice = urlInfo.device;
        await this.processUrl(urlInfo, finalOptions);
      }
    } finally {
      await this.browserManager.close();
    }

    return this.results;
  }

  async processUrl(urlInfo, options) {
    const { url, language, device, pageType, siteName, viewport } = urlInfo;

    console.log(`🔗 Обробляємо URL: ${url} (${siteName}/${language}/${device}/${pageType})`);

    let attempts = 0;
    let success = false;
    let error = null;

    while (attempts < options.retryCount && !success) {
      attempts++;

      try {
        await this.browserManager.createPage(device);
        await this.browserManager.setViewport(viewport);
        await this.browserManager.navigateToUrl(url);

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
}
