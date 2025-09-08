import puppeteer from 'puppeteer';
import { AutoParser } from './auto-parser.js';

export class AutoDiscoverer {
  constructor() {
    this.autoParser = new AutoParser();
  }

  async discoverUrls(baseUrl) {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    try {
      await page.setViewport({ width: 1450, height: 1080 });
      await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 0 });

      const result = await this.autoParser.findCategoryAndProduct(page, baseUrl);

      if (result) {
        const urls = [baseUrl];
        if (result.categoryUrl) urls.push(result.categoryUrl);
        if (result.productUrl) urls.push(result.productUrl);
        return urls;
      }

      return [baseUrl];

    } finally {
      await browser.close();
    }
  }
}
