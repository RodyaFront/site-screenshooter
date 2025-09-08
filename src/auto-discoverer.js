import puppeteer from 'puppeteer';
import { HoroshopDiscoveryStrategy } from './discovery-strategies/horoshop-discovery-strategy.js';
import { GenericDiscoveryStrategy } from './discovery-strategies/generic-discovery-strategy.js';

export class AutoDiscoverer {
  constructor() {
    this.strategies = [
      new HoroshopDiscoveryStrategy(),
      new GenericDiscoveryStrategy()
    ];
  }

  async discoverUrls(baseUrl) {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    try {
      await page.setViewport({ width: 1450, height: 1080 });
      await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 0 });

      // Находим подходящую стратегию
      const strategy = this.findBestStrategy(baseUrl);
      return await strategy.discoverUrls(baseUrl, page);

    } finally {
      await browser.close();
    }
  }

  findBestStrategy(baseUrl) {
    // Сортируем стратегии по приоритету (от высокого к низкому)
    const sortedStrategies = this.strategies.sort((a, b) => b.getPriority() - a.getPriority());

    // Находим первую подходящую стратегию
    for (const strategy of sortedStrategies) {
      if (strategy.canHandle(baseUrl)) {
        return strategy;
      }
    }

    // Fallback на generic стратегию
    return this.strategies.find(s => s.name === 'generic');
  }
}
