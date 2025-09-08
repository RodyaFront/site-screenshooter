export class BaseDiscoveryStrategy {
  constructor() {
    this.name = 'base';
  }

  async discoverUrls(baseUrl, page) {
    throw new Error('discoverUrls must be implemented by subclass');
  }

  canHandle(baseUrl) {
    throw new Error('canHandle must be implemented by subclass');
  }

  getPriority() {
    return 0;
  }
}
