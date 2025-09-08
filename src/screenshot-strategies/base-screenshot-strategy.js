export class BaseScreenshotStrategy {
  constructor(device, language) {
    this.device = device;
    this.language = language;
  }

  async setupPage(page) {
    throw new Error('setupPage must be implemented by subclass');
  }

  getViewportConfig() {
    throw new Error('getViewportConfig must be implemented by subclass');
  }

  getUserAgent() {
    throw new Error('getUserAgent must be implemented by subclass');
  }

  generateFileName(url) {
    const urlObj = new URL(url);
    let pathname = urlObj.pathname;
    pathname = pathname.replace(/^\/+|\/+$/g, '');

    if (!pathname) {
      return `${this.device}_${this.language}_home.png`;
    }

    const cleanName = pathname
      .replace(/\//g, '_')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    return `${this.device}_${this.language}_${cleanName}.png`;
  }

  addLanguagePrefix(url) {
    if (this.language === 'default') {
      return url;
    }

    if (this.language === 'en') {
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
}
