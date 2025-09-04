#!/usr/bin/env node

import { ConfigLoader } from './src/config.js';
import { UrlGenerator } from './src/url-generator.js';
import { ScreenshotManager } from './src/screenshot.js';
import { CLI } from './src/cli.js';
import { Logger } from './src/logger.js';
import ora from 'ora';

class ScreenshooterApp {
  constructor() {
    this.cli = new CLI();
    this.logger = null;
    this.configLoader = null;
    this.urlGenerator = new UrlGenerator();
    this.screenshotManager = null;
  }

  async run() {
    try {
      const options = await this.cli.handleCommand();

      this.logger = new Logger({
        verbose: options.verbose
      });

      this.logger.createLogFile(options.output);

      this.logger.info('🚀 Запуск Website Screenshooter');

      await this.loadConfig(options.config);
      const urls = await this.generateUrls(options);
      this.screenshotManager = new ScreenshotManager(options.output);
      await this.takeScreenshots(urls, options);
      await this.showResults();

      this.logger.success('🎉 Скрипт завершено успішно!');

    } catch (error) {
      if (this.logger) {
        this.logger.error('Критична помилка:', error.message);
      } else {
        console.error('❌ Критична помилка:', error.message);
      }
      process.exit(1);
    }
  }

  async loadConfig(configPath) {
    this.logger.info(`📋 Завантаження конфігурації: ${configPath}`);

    this.configLoader = new ConfigLoader(configPath);
    this.config = this.configLoader.load();

    const sitesCount = this.config.sites.length;
    this.logger.success(`Конфігурацію завантажено: ${sitesCount} сайт(ів)`);
  }

  async generateUrls(options) {
    this.logger.info('🔗 Генерація URL-ів...');

    let allUrls = [];

    const sitesToProcess = options.site
      ? [options.site]
      : this.configLoader.getSites();

    for (const siteName of sitesToProcess) {
      const siteConfig = this.configLoader.getSiteConfig(siteName);
      const filteredConfig = this.applyFilters(siteConfig, options);
      const siteUrls = this.urlGenerator.generateSiteUrls(filteredConfig);
      allUrls = allUrls.concat(siteUrls);
    }

    allUrls = this.urlGenerator.filterUrls(allUrls, {
      sites: options.site ? [options.site] : undefined,
      languages: options.languages,
      devices: options.devices,
      pages: options.pages
    });

    const totalUrls = allUrls.length;
    this.logger.success(`Згенеровано ${totalUrls} URL-ів для обробки`);

    return allUrls;
  }

  applyFilters(siteConfig, options) {
    return {
      ...siteConfig,
      languages: options.languages,
      devices: options.devices,
      pages: this.buildPagesConfig(siteConfig, options.pages)
    };
  }

  buildPagesConfig(siteConfig, requestedPages) {
    const pages = {};

    requestedPages.forEach(pageType => {
      if (siteConfig.pages && siteConfig.pages[pageType]) {
        pages[pageType] = siteConfig.pages[pageType];
      } else {
        const defaultPaths = {
          home: '/',
          category: '/catalog',
          product: '/product/example'
        };
        pages[pageType] = defaultPaths[pageType];
      }
    });

    return pages;
  }

  async takeScreenshots(urls, options) {
    this.logger.info('📸 Починаємо створення скріншотів...');

    const spinner = ora('Створення скріншотів...').start();

    try {
      const results = await this.screenshotManager.takeScreenshots(urls, {
        retryCount: options.retry,
        retryDelay: options.delay
      });

      spinner.succeed(`Створення скріншотів завершено`);

      this.logger.info(`Оброблено ${results.length} завдань`);

    } catch (error) {
      spinner.fail('Помилка створення скріншотів');
      throw error;
    }
  }

  async showResults() {
    const stats = this.screenshotManager.getStats();
    const errors = this.screenshotManager.getErrors();
    const successful = this.screenshotManager.getSuccessful();

    this.logger.logStats(stats);
    this.logger.logErrors(errors);

    const logFile = this.logger.logFile.replace('.log', '-results.json');
    this.screenshotManager.results.forEach(result => {
      this.logger.info(`Результат: ${result.siteName}/${result.language}/${result.device}/${result.pageType}`, {
        success: result.success,
        url: result.url,
        fileName: result.fileName,
        error: result.error,
        attempts: result.attempts
      });
    });

    this.logger.saveLogsToFile(logFile);

    if (errors.length === 0) {
      this.logger.success(`🎉 Всі ${stats.total} скріншотів створено успішно!`);
    } else {
      this.logger.warn(`⚠️ Створено ${stats.successful} з ${stats.total} скріншотів. ${errors.length} помилок.`);
    }
  }
}

const app = new ScreenshooterApp();
app.run().catch(error => {
  console.error('❌ Неочікувана помилка:', error);
  process.exit(1);
});
