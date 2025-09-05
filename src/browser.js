import puppeteer from 'puppeteer';

export class BrowserManager {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async launch(options = {}) {
    const defaultOptions = {
      headless: "new",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--mute-audio',
        '--no-default-browser-check',
        '--no-pings',
        '--disable-background-networking',
        '--disable-component-extensions-with-background-pages'
      ]
    };

    this.browser = await puppeteer.launch({
      ...defaultOptions,
      ...options
    });

    return this.browser;
  }

  async createPage(device = 'desktop') {
    if (!this.browser) {
      throw new Error('Браузер не запущений. Спочатку викличте launch()');
    }

    this.page = await this.browser.newPage();

    await this.page.setUserAgent(this.getUserAgent(device));

    await this.page.setExtraHTTPHeaders({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    });

    this.page.setDefaultTimeout(30000);
    this.page.setDefaultNavigationTimeout(30000);

    return this.page;
  }

  async clearCookiesAndCache() {
    if (!this.page) return;

    try {
      const client = await this.page.target().createCDPSession();
      await client.send('Network.clearBrowserCookies');
      await client.send('Network.clearBrowserCache');
      await client.detach();
    } catch (error) {
      console.warn('Помилка очистки куки та кешу:', error.message);
    }
  }

  async clearLocalStorage() {
    if (!this.page) return;

    try {
      await this.page.evaluate(() => {
        if (typeof localStorage !== 'undefined') {
          localStorage.clear();
        }

        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.clear();
        }

        if (typeof indexedDB !== 'undefined') {
          indexedDB.databases().then(databases => {
            databases.forEach(db => {
              indexedDB.deleteDatabase(db.name);
            });
          });
        }
      });
    } catch (error) {
      console.warn('Помилка очистки локального хранилища:', error.message);
    }
  }

  async clearAllData() {
    await this.clearCookiesAndCache();
    await this.clearLocalStorage();
  }

  getUserAgent(device = 'desktop') {
    const userAgents = {
      desktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    };

    return userAgents[device] || userAgents.desktop;
  }

  async setViewport(viewport) {
    if (!this.page) {
      throw new Error('Сторінка не створена. Спочатку викличте createPage()');
    }

    await this.page.setViewport({
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      isMobile: viewport.width <= 768,
      hasTouch: viewport.width <= 768
    });
  }


  async navigateToUrl(url, device = 'desktop', waitOptions = {}) {
    if (!this.page) {
      throw new Error('Сторінка не створена. Спочатку викличте createPage()');
    }

    const defaultWaitOptions = {
      waitUntil: 'networkidle2',
      timeout: 30000
    };

    const urlWithQuery = this.addVersionQuery(url, device);

    try {
      await this.clearCookiesAndCache();

      await this.page.goto(urlWithQuery, {
        ...defaultWaitOptions,
        ...waitOptions
      });

      await this.clearLocalStorage();

      await this.page.waitForTimeout(5000);

      return true;
    } catch (error) {
      throw new Error(`Помилка навігації на ${urlWithQuery}: ${error.message}`);
    }
  }

  addVersionQuery(url, device) {
    const versionParam = device === 'mobile' ? 'v=mobile' : 'v=pc';
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${versionParam}`;
  }

  async takeScreenshot(filePath, options = {}) {
    if (!this.page) {
      throw new Error('Сторінка не створена. Спочатку викличте createPage()');
    }

    const defaultOptions = {
      fullPage: true,
      type: 'png'
    };

    try {
      await this.page.screenshot({
        path: filePath,
        ...defaultOptions,
        ...options
      });

      return true;
    } catch (error) {
      throw new Error(`Помилка створення скріншота ${filePath}: ${error.message}`);
    }
  }

  async checkUrlAvailability(url, device = 'desktop') {
    if (!this.page) {
      throw new Error('Сторінка не створена. Спочатку викличте createPage()');
    }

    try {
      const urlWithQuery = this.addVersionQuery(url, device);
      const response = await this.page.goto(urlWithQuery, {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });

      return response && response.status() < 400;
    } catch (error) {
      return false;
    }
  }

  async getPageInfo() {
    if (!this.page) {
      throw new Error('Сторінка не створена. Спочатку викличте createPage()');
    }

    try {
      const title = await this.page.title();
      const url = this.page.url();
      const viewport = this.page.viewport();

      return {
        title,
        url,
        viewport
      };
    } catch (error) {
      throw new Error(`Помилка отримання інформації про сторінку: ${error.message}`);
    }
  }

  async closePage() {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
  }

  async close() {
    if (this.page) {
      await this.closePage();
    }

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async fullCleanup() {
    if (this.browser) {
      const pages = await this.browser.pages();
      await Promise.all(pages.map(page => page.close()));
    }

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }

    this.page = null;

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  isLaunched() {
    return this.browser !== null;
  }

  hasPage() {
    return this.page !== null;
  }
}
