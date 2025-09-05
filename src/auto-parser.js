export class AutoParser {
  constructor() {
    this.categorySelectors = [
      'a.products-menu__title-link',
      'a.productsMenu-tabs-list__link',
      '.products-menu__container a[href]',
      '.productsMenu-tabs-list a[href]',
      'nav a[href*="/"]',
      '.menu a[href*="/"]',
      '.navigation a[href*="/"]',
      '.header a[href*="/"]',
      '.main-menu a[href*="/"]',
      '.top-menu a[href*="/"]',
      '.site-menu a[href*="/"]',
      'a[href*="/category/"]',
      'a[href*="/catalog/"]',
      'a[href*="/categories/"]'
    ];

    this.productSelectors = [
      '.catalogCard-image[href]',
      '.catalogCard-title a[href]',
      '.catalog-grid__item .catalogCard-image[href]',
      '.catalog-grid__item .catalogCard-title a[href]',
      '.product-item a[href]',
      '.product-card a[href]',
      '.product a[href]',
      '.item a[href]',
      '.goods-item a[href]',
      'a[href*="/product/"]',
      'a[href*="/item/"]',
      'a[href*="/goods/"]',
      '.catalog-item a[href]',
      '.product-list-item a[href]',
      '.grid-item a[href]'
    ];

    this.menuSelectors = [
      '.products-menu',
      '.menu',
      'nav',
      '.navigation',
      '.main-menu',
      '.top-menu',
      '.site-menu',
      '.header-menu'
    ];

    this.productsSelectors = [
      '.catalog-grid',
      '.product-list',
      '.catalog-list',
      '.products-grid',
      '.catalog-items',
      '.product-items',
      '.goods-list',
      '.items-grid'
    ];
  }

  async findCategoryFromMenu(page, baseUrl, device) {
    console.log(`🔍 Пошук категорії в меню для ${device}...`);

    try {
      await this.waitForMenuLoad(page);

      for (const selector of this.categorySelectors) {
        try {
          const links = await page.$$eval(selector, (elements, baseUrl) => {
            return elements
              .map(el => el.href)
              .filter(href => {
                if (!href || href === '#' || href === 'javascript:void(0)') {
                  return false;
                }

                if (href === baseUrl || href === baseUrl + '/') {
                  return false;
                }

                return href.includes(baseUrl) && href !== baseUrl;
              });
          }, baseUrl);

          if (links.length > 0) {
            const categoryUrl = links[0];
            console.log(`✅ Знайдено категорію: ${categoryUrl}`);
            return categoryUrl;
          }
        } catch (error) {
          console.log(`⚠️ Селектор ${selector} не знайшов елементи`);
          continue;
        }
      }

      console.log(`❌ Категорії не знайдено`);
      return null;
    } catch (error) {
      console.error(`❌ Помилка пошуку категорії: ${error.message}`);
      return null;
    }
  }

  /**
   * Находит первый товар на странице категории
   * @param {Object} page - Puppeteer page объект
   * @param {string} baseUrl - Базовый URL сайта
   * @returns {Promise<string|null>} URL товара или null
   */
  async findFirstProductFromCategory(page, baseUrl) {
    console.log(`🔍 Пошук товару на сторінці категорії...`);

    try {
      await this.waitForProductsLoad(page);

      for (const selector of this.productSelectors) {
        try {
          const links = await page.$$eval(selector, (elements, baseUrl) => {
            return elements
              .map(el => el.href)
              .filter(href => {
                if (!href || href === '#' || href === 'javascript:void(0)') {
                  return false;
                }

                return href.includes(baseUrl) && href !== baseUrl;
              });
          }, baseUrl);

          if (links.length > 0) {
            const productUrl = links[0];
            console.log(`✅ Знайдено товар: ${productUrl}`);
            return productUrl;
          }
        } catch (error) {
          console.log(`⚠️ Селектор ${selector} не знайшов елементи`);
          continue;
        }
      }

      console.log(`❌ Товари не знайдено`);
      return null;
    } catch (error) {
      console.error(`❌ Помилка пошуку товару: ${error.message}`);
      return null;
    }
  }

  async waitForMenuLoad(page, timeout = 10000) {
    console.log(`⏳ Очікування завантаження меню...`);

    try {
      await page.waitForFunction(
        (selectors) => {
          return selectors.some(selector => {
            const elements = document.querySelectorAll(selector);
            return elements.length > 0;
          });
        },
        { timeout },
        this.menuSelectors
      );

      console.log(`✅ Меню завантажено`);
    } catch (error) {
      console.log(`⚠️ Меню не завантажилось за ${timeout}мс, продовжуємо...`);
    }
  }

  async waitForProductsLoad(page, timeout = 10000) {
    console.log(`⏳ Очікування завантаження товарів...`);

    try {
      await page.waitForFunction(
        (selectors) => {
          return selectors.some(selector => {
            const elements = document.querySelectorAll(selector);
            return elements.length > 0;
          });
        },
        { timeout },
        this.productsSelectors
      );

      console.log(`✅ Товари завантажено`);
    } catch (error) {
      console.log(`⚠️ Товари не завантажились за ${timeout}мс, продовжуємо...`);
    }
  }

  addVersionQuery(url, device) {
    const versionParam = device === 'mobile' ? 'v=mobile' : 'v=pc';
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${versionParam}`;
  }

  addLanguagePrefix(url, language) {
    if (language === 'default') {
      return url;
    }

    if (language === 'en') {
      const urlObj = new URL(url);
      const path = urlObj.pathname;

      if (path.startsWith('/en/')) {
        return url;
      }

      urlObj.pathname = '/en' + path;
      return urlObj.toString();
    }

    return url;
  }

  processUrl(url, language, device) {
    let processedUrl = this.addLanguagePrefix(url, language);
    processedUrl = this.addVersionQuery(processedUrl, device);
    return processedUrl;
  }
}
