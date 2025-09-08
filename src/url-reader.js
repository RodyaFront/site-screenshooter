import fs from 'fs';
import { Logger } from './logger.js';


export class UrlReader {
  constructor(filename = 'urls.txt') {
    this.filename = filename;
  }

  readUrls() {
    try {
      const content = fs.readFileSync(this.filename, 'utf8');
      return content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));
    } catch (error) {
      throw new Error(`Помилка читання файла ${this.filename}: ${error.message}`);
    }
  }

  groupUrlsByDomain(urls) {
    const domainGroups = {};

    for (const url of urls) {
      if (url === 'auto') continue;

      try {
        const domain = new URL(url).hostname;
        if (!domainGroups[domain]) {
          domainGroups[domain] = [];
        }
        domainGroups[domain].push(url);
      } catch (error) {
        Logger.warning(`⚠️ Невірний URL: ${url}`);
      }
    }

    return domainGroups;
  }

  getDomainsForAutoDiscovery(domainGroups) {
    const domainsForAuto = [];

    for (const [domain, urls] of Object.entries(domainGroups)) {
      const rootUrls = urls.filter(url => url.endsWith('/'));

      if (rootUrls.length === 1) {
        domainsForAuto.push({
          domain,
          baseUrl: rootUrls[0],
          allUrls: urls
        });
      }
    }

    return domainsForAuto;
  }

  hasOnlyRootUrl(urls) {
    return urls.length === 1 && urls[0].endsWith('/');
  }

  findBaseUrlForAuto(urls) {
    return urls.find(u => u !== 'auto' && u.endsWith('/'));
  }
}
