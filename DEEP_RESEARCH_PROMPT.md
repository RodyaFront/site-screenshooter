# Промпт для Deep Research - Проблема с пустым пространством в мобильных скриншотах Puppeteer

## 🎯 **Основная проблема:**
При создании мобильных скриншотов с помощью Puppeteer появляется лишнее пустое пространство под футером, которое НЕ видно при ручном просмотре страницы в браузере.

## 🔍 **Детали проблемы:**

### **Что работает:**
- ✅ Desktop скриншоты - работают корректно
- ✅ Ручной просмотр в браузере - пустого пространства нет
- ✅ Мобильный viewport настроен правильно (375x667, deviceScaleFactor: 2, isMobile: true, hasTouch: true)

### **Что не работает:**
- ❌ Мобильные скриншоты содержат лишнее пустое пространство под футером
- ❌ Проблема возникает только в headless режиме Puppeteer
- ❌ В head-full режиме проблемы нет

## 🛠️ **Уже испробованные решения (все не помогли):**

### 1. **Параметры viewport**
- Добавление `hasTouch: true`, `isLandscape: false`
- Изменение `deviceScaleFactor` с 2 на 3
- **Результат:** ❌ Не помогло

### 2. **Clip вместо fullPage**
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

await page.screenshot({
  path: screenshotPath,
  clip: { x: 0, y: 0, width: 375, height: contentHeight }
});
```
**Результат:** ❌ Не помогло

### 3. **Поиск реальной высоты видимого контента**
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

### 4. **captureBeyondViewport: false**
```javascript
await page.screenshot({
  path: screenshotPath,
  fullPage: true,
  captureBeyondViewport: false
});
```
**Результат:** ❌ Не помогло

### 5. **fullPageMaxHeight**
```javascript
await page.screenshot({
  path: screenshotPath,
  fullPage: true,
  fullPageMaxHeight: 10000
});
```
**Результат:** ❌ Не помогло

### 6. **Двойная установка viewport (из статьи)**
```javascript
// Первая установка с произвольной высотой
await page.setViewport({ width: 375, height: 600, ... });

// Вторая установка с реальной высотой
const contentHeight = await page.evaluate(() => document.body.clientHeight);
await page.setViewport({ width: 375, height: contentHeight, ... });
```
**Результат:** ❌ Футер "перенёсся" вниз, появилось пустое пространство над футером

### 7. **Math.max() для расчета высоты**
**Результат:** ❌ Не помогло - Math.max() делает viewport ещё больше

## 🔧 **Технические детали:**

### **Настройки Puppeteer:**
```javascript
await page.setViewport({
  width: 375,
  height: 667,
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  isLandscape: false
});

await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1');
```

### **Настройки скриншота:**
```javascript
await page.screenshot({
  path: screenshotPath,
  fullPage: true
});
```

### **Тестовая страница:**
- URL: https://design337.horoshop.ua/
- Сайт использует MobileDetect PHP
- Есть query параметры `?v=pc` и `?v=mobile`

## 🎯 **Вопросы для исследования:**

1. **Почему пустое пространство появляется только в headless режиме?**
2. **Какие скрытые элементы могут создавать лишнее пространство?**
3. **Как MobileDetect PHP может влиять на рендеринг в Puppeteer?**
4. **Есть ли различия в обработке CSS между headless и head-full режимами?**
5. **Может ли проблема быть связана с асинхронной загрузкой контента?**
6. **Какие альтернативные подходы к созданию мобильных скриншотов существуют?**

## 📊 **Ожидаемый результат:**
Нужно найти решение, которое уберет лишнее пустое пространство под футером в мобильных скриншотах, сохранив при этом корректное отображение всего контента.

---
**Версия Puppeteer:** 21.0.0
**Node.js:** >=18.0.0
**ОС:** Linux WSL2
