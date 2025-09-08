import { BaseDiscoveryStrategy } from './base-discovery-strategy.js';

export class GenericDiscoveryStrategy extends BaseDiscoveryStrategy {
  constructor() {
    super();
    this.name = 'generic';
  }

  canHandle(baseUrl) {
    return true;
  }

  getPriority() {
    return 1;
  }

  async discoverUrls(baseUrl, page) {
    return [baseUrl];
  }
}
