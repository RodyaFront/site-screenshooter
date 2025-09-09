# Проблема с пустым пространством в мобильных скриншотах

## 🐛 Описание проблемы
В мобильных скриншотах появляется лишнее пустое пространство под футером, которое не видно при ручном просмотре страницы в браузере.

## 🔍 Анализ проблемы

### Что работает:
- ✅ В браузере (ручной просмотр) - пустого пространства нет
- ✅ Desktop скриншоты - работают корректно
- ✅ Мобильный viewport настроен правильно

### Что не работает:
- ❌ Мобильные скриншоты содержат лишнее пустое пространство
- ❌ `fullPage: true` захватывает больше, чем видит пользователь

## 🛠️ Попытки решения

### 1. Добавление параметров viewport
**Файл:** `src/screenshot-strategies/mobile-screenshot-strategy.js`
```javascript
getViewportConfig() {
  return {
    width: 375,
    height: 667,
    deviceScaleFactor: 3,  // Изменено с 2 на 3
    isMobile: true,
    hasTouch: true,        // Добавлено
    isLandscape: false     // Добавлено
  };
}
```
**Результат:** ❌ Не помогло

### 2. Использование clip вместо fullPage
**Файл:** `src/screenshot-manager.js`
```javascript
// Получаем размеры контента
const contentHeight = await page.evaluate(() => {
  return Math.max(
    document.body.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.clientHeight,
    document.documentElement.scrollHeight,
    document.documentElement.offsetHeight
  );
});

await page.screenshot({
  path: screenshotPath,
  clip: {
    x: 0,
    y: 0,
    width: 375,
    height: contentHeight
  }
});
```
**Результат:** ❌ Не помогло

### 3. Поиск реальной высоты видимого контента
**Файл:** `src/screenshot-manager.js`
```javascript
const realContentHeight = await page.evaluate(() => {
  const allElements = document.querySelectorAll('*');
  let maxBottom = 0;

  allElements.forEach(el => {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);

    if (rect.height > 0 &&
        style.visibility !== 'hidden' &&
        style.display !== 'none' &&
        style.opacity !== '0') {
      maxBottom = Math.max(maxBottom, rect.bottom);
    }
  });

  return Math.ceil(maxBottom);
});
```
**Результат:** ❌ Не помогло

### 4. captureBeyondViewport: false
**Файл:** `src/screenshot-manager.js`
```javascript
await page.screenshot({
  path: screenshotPath,
  fullPage: true,
  captureBeyondViewport: false
});
```
**Результат:** ❌ Не помогло

### 5. fullPageMaxHeight
**Файл:** `src/screenshot-manager.js`
```javascript
await page.screenshot({
  path: screenshotPath,
  fullPage: true,
  fullPageMaxHeight: 10000
});
```
**Результат:** ❌ Не помогло

### 6. Двойная установка viewport (из статьи)
**Файл:** `src/screenshot-strategies/mobile-screenshot-strategy.js`
```javascript
// Первая установка с произвольной высотой
await page.setViewport({ width: 375, height: 600, ... });

// Вторая установка с реальной высотой
const contentHeight = await page.evaluate(() => document.body.clientHeight);
await page.setViewport({ width: 375, height: contentHeight, ... });
```
**Результат:** ❌ Футер "перенёсся" вниз, появилось пустое пространство над футером

### 7. Math.max() для расчета высоты
**Файл:** `src/screenshot-strategies/mobile-screenshot-strategy.js`
```javascript
const contentHeight = await page.evaluate(() => {
  return Math.max(
    document.body.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.clientHeight,
    document.documentElement.scrollHeight,
    document.documentElement.offsetHeight
  );
});
```
**Результат:** ❌ Не помогло - Math.max() делает viewport ещё больше

## 🎯 Следующие шаги

### Вариант C: Поиск последнего элемента футера
```javascript
const footerBottom = await page.evaluate(() => {
  const footer = document.querySelector('footer') ||
                 document.querySelector('.footer') ||
                 document.querySelector('[class*="footer"]');
  return footer ? footer.getBoundingClientRect().bottom : 0;
});
```

### Вариант D: Комбинированный подход
- Найти футер
- Добавить небольшой отступ (например, 20px)
- Использовать clip с точной высотой

## 📊 Тестовые данные
- **URL:** https://design337.horoshop.ua/
- **Viewport:** 375x667, deviceScaleFactor: 3
- **User-Agent:** iPhone Safari
- **Проблема:** Пустое пространство под футером

## 🔧 Инструменты для отладки
- DevTools для ручной проверки
- 20-секундная пауза с открытым браузером
- Логирование высоты контента в консоль

---
**Дата создания:** $(date)
**Статус:** В процессе решения
