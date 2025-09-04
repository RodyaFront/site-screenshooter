import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ConfigLoader {
  constructor(configPath) {
    this.configPath = configPath;
    this.config = null;
  }

  load() {
    try {
      const fullPath = path.resolve(this.configPath);

      if (!fs.existsSync(fullPath)) {
        throw new Error(`Конфігураційний файл не знайдено: ${fullPath}`);
      }

      const configContent = fs.readFileSync(fullPath, 'utf8');
      this.config = JSON.parse(configContent);

      this.validate();
      return this.config;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Помилка парсингу JSON у файлі ${this.configPath}: ${error.message}`);
      }
      throw error;
    }
  }

  validate() {
    if (!this.config) {
      throw new Error('Конфігурацію не завантажено');
    }

    if (!this.config.sites || !Array.isArray(this.config.sites)) {
      throw new Error('Конфігурація повинна містити масив "sites"');
    }

    if (this.config.sites.length === 0) {
      throw new Error('Масив "sites" не може бути порожнім');
    }

    this.config.sites.forEach((site, index) => {
      this.validateSite(site, index);
    });

    this.validateDefaults();
  }

  validateSite(site, index) {
    if (!site.name || typeof site.name !== 'string') {
      throw new Error(`Сайт #${index}: поле "name" обов'язкове і повинно бути рядком`);
    }

    if (!site.baseUrl || typeof site.baseUrl !== 'string') {
      throw new Error(`Сайт #${index}: поле "baseUrl" обов'язкове і повинно бути рядком`);
    }

    try {
      new URL(site.baseUrl);
    } catch {
      throw new Error(`Сайт #${index}: "baseUrl" повинен бути валідним URL`);
    }

    if (site.pages) {
      if (typeof site.pages !== 'object') {
        throw new Error(`Сайт #${index}: "pages" повинно бути об'єктом`);
      }

      const requiredPages = ['home', 'category', 'product'];
      requiredPages.forEach(pageType => {
        if (!site.pages[pageType]) {
          throw new Error(`Сайт #${index}: відсутня сторінка "${pageType}"`);
        }
        if (typeof site.pages[pageType] !== 'string') {
          throw new Error(`Сайт #${index}: сторінка "${pageType}" повинна бути рядком`);
        }
      });
    }

    if (site.languages) {
      if (!Array.isArray(site.languages)) {
        throw new Error(`Сайт #${index}: "languages" повинно бути масивом`);
      }
      if (site.languages.length === 0) {
        throw new Error(`Сайт #${index}: масив "languages" не може бути порожнім`);
      }
    }

    if (site.devices) {
      if (!Array.isArray(site.devices)) {
        throw new Error(`Сайт #${index}: "devices" повинно бути масивом`);
      }
      if (site.devices.length === 0) {
        throw new Error(`Сайт #${index}: масив "devices" не може бути порожнім`);
      }
    }
  }

  validateDefaults() {
    if (!this.config.defaults) {
      this.config.defaults = {
        languages: ['default', 'en'],
        devices: ['desktop', 'mobile'],
        viewport: {
          desktop: { width: 1920, height: 1080 },
          mobile: { width: 375, height: 667 }
        }
      };
      return;
    }

    if (!this.config.defaults.languages || !Array.isArray(this.config.defaults.languages)) {
      this.config.defaults.languages = ['default', 'en'];
    }

    if (!this.config.defaults.devices || !Array.isArray(this.config.defaults.devices)) {
      this.config.defaults.devices = ['desktop', 'mobile'];
    }

    if (!this.config.defaults.viewport) {
      this.config.defaults.viewport = {
        desktop: { width: 1920, height: 1080 },
        mobile: { width: 375, height: 667 }
      };
    } else {
      ['desktop', 'mobile'].forEach(device => {
        if (!this.config.defaults.viewport[device]) {
          this.config.defaults.viewport[device] = device === 'desktop'
            ? { width: 1920, height: 1080 }
            : { width: 375, height: 667 };
        } else {
          if (!this.config.defaults.viewport[device].width || !this.config.defaults.viewport[device].height) {
            throw new Error(`Viewport для "${device}" повинен містити width і height`);
          }
        }
      });
    }
  }

  getSiteConfig(siteName) {
    if (!this.config) {
      throw new Error('Конфігурацію не завантажено');
    }

    const site = this.config.sites.find(s => s.name === siteName);
    if (!site) {
      throw new Error(`Сайт "${siteName}" не знайдено в конфігурації`);
    }

    return {
      ...site,
      languages: site.languages || this.config.defaults.languages,
      devices: site.devices || this.config.defaults.devices,
      viewport: this.config.defaults.viewport
    };
  }

  getSites() {
    if (!this.config) {
      throw new Error('Конфігурацію не завантажено');
    }
    return this.config.sites.map(site => site.name);
  }

  getDefaults() {
    if (!this.config) {
      throw new Error('Конфігурацію не завантажено');
    }
    return this.config.defaults;
  }
}
