export class UrlGenerator {
  constructor() {
    this.pageTypes = ['home', 'category', 'product'];
  }

  generateSiteUrls(siteConfig) {
    const urls = [];

    for (const language of siteConfig.languages) {
      for (const device of siteConfig.devices) {
        for (const pageType of this.pageTypes) {
          const url = this.generateUrl(siteConfig, language, device, pageType);
          urls.push({
            url,
            language,
            device,
            pageType,
            siteName: siteConfig.name,
            viewport: siteConfig.viewport[device]
          });
        }
      }
    }

    return urls;
  }

  generateUrl(siteConfig, language, device, pageType) {
    const baseUrl = siteConfig.baseUrl.replace(/\/$/, '');
    let path = siteConfig.pages[pageType];

    if (language === 'en') {
      path = this.addLanguagePrefix(path);
    }

    const fullUrl = `${baseUrl}${path}`;

    return fullUrl;
  }

  addLanguagePrefix(path) {
    if (!path) return '/en/';

    if (path.startsWith('/en/')) {
      return path;
    }

    if (path.startsWith('/')) {
      return `/en${path}`;
    }

    return `/en/${path}`;
  }


  generateFileName(siteName, language, device, pageType) {
    return `${siteName}/${language}/${device}/${pageType}.png`;
  }

  generateTaskDescription(siteName, language, device, pageType) {
    const langLabel = language === 'default' ? 'основний' : 'англійський';
    const deviceLabel = device === 'desktop' ? 'десктоп' : 'мобільний';

    return `${siteName} - ${langLabel} мова, ${deviceLabel}, ${pageType}`;
  }

  filterUrls(urls, filters = {}) {
    let filtered = urls;

    if (filters.sites && filters.sites.length > 0) {
      filtered = filtered.filter(url => filters.sites.includes(url.siteName));
    }

    if (filters.languages && filters.languages.length > 0) {
      filtered = filtered.filter(url => filters.languages.includes(url.language));
    }

    if (filters.devices && filters.devices.length > 0) {
      filtered = filtered.filter(url => filters.devices.includes(url.device));
    }

    if (filters.pages && filters.pages.length > 0) {
      filtered = filtered.filter(url => filters.pages.includes(url.pageType));
    }

    return filtered;
  }

  groupBySite(urls) {
    const grouped = {};

    urls.forEach(url => {
      if (!grouped[url.siteName]) {
        grouped[url.siteName] = [];
      }
      grouped[url.siteName].push(url);
    });

    return grouped;
  }

  countTasks(urls) {
    return urls.length;
  }

  countTasksBySite(urls) {
    const grouped = this.groupBySite(urls);
    const counts = {};

    Object.keys(grouped).forEach(siteName => {
      counts[siteName] = grouped[siteName].length;
    });

    return counts;
  }
}
