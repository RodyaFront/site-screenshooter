import { BaseDiscoveryStrategy } from './base-discovery-strategy.js';
import { AutoParser } from '../auto-parser.js';

export class HoroshopDiscoveryStrategy extends BaseDiscoveryStrategy {
  constructor() {
    super();
    this.name = 'horoshop';
    this.autoParser = new AutoParser();
  }

  canHandle(baseUrl) {
    return baseUrl.includes('horoshop.ua');
  }

  getPriority() {
    return 10;
  }

  async discoverUrls(baseUrl, page) {
    const result = await this.autoParser.findCategoryAndProduct(page, baseUrl);

    if (result) {
      const urls = [baseUrl];
      if (result.categoryUrl) urls.push(result.categoryUrl);
      if (result.productUrl) urls.push(result.productUrl);
      return urls;
    }

    return [baseUrl];
  }
}
