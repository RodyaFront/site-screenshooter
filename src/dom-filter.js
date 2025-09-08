export class DomFilter {
  constructor() {
    this.bannedSelectors = [
      '.upButton',
      '#upButton'
    ];
  }

  async cleanPage(page) {
    try {
      console.log('🧹 Очистка DOM від заборонених елементів...');

      const removedCount = await page.evaluate((selectors) => {
        let totalRemoved = 0;

        for (const selector of selectors) {
          try {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
              element.remove();
              totalRemoved++;
            });
          } catch (error) {
            // Игнорируем ошибки селекторов
          }
        }

        return totalRemoved;
      }, this.bannedSelectors);

      console.log(`✅ Видалено ${removedCount} заборонених елементів`);
      return removedCount;

    } catch (error) {
      console.error('❌ Помилка очистки DOM:', error.message);
      return 0;
    }
  }

  addBannedSelector(selector) {
    if (!this.bannedSelectors.includes(selector)) {
      this.bannedSelectors.push(selector);
    }
  }

  removeBannedSelector(selector) {
    const index = this.bannedSelectors.indexOf(selector);
    if (index > -1) {
      this.bannedSelectors.splice(index, 1);
    }
  }

  getBannedSelectors() {
    return [...this.bannedSelectors];
  }

  setBannedSelectors(selectors) {
    this.bannedSelectors = [...selectors];
  }
}
