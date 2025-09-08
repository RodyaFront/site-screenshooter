import puppeteer from 'puppeteer';
import fs from 'fs';
import { AutoParser } from './src/auto-parser.js';

function readUrlsFromFile(filename = 'urls.txt') {
  try {
    const content = fs.readFileSync(filename, 'utf8');
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
  } catch (error) {
    console.error(`❌ Помилка читання файла ${filename}:`, error.message);
    process.exit(1);
  }
}

function generateFileName(url, device, language, index) {
  try {
    const urlObj = new URL(url);
    let pathname = urlObj.pathname;

    pathname = pathname.replace(/^\/+|\/+$/g, '');

    if (!pathname) {
      return `${device}_${language}_home.png`;
    }

    const cleanName = pathname
      .replace(/\//g, '_')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    return `${device}_${language}_${cleanName}.png`;
  } catch (error) {
    return `${device}_${language}_page_${index + 1}.png`;
  }
}

function addLanguagePrefix(url, language) {
  if (language === 'default') {
    return url;
  }

  if (language === 'en') {
    const urlObj = new URL(url);
    const path = urlObj.pathname;

    if (path.startsWith('/en/')) {
      return url;
    }

    if (path === '/') {
      urlObj.pathname = '/en/';
    } else {
      urlObj.pathname = '/en' + path;
    }

    return urlObj.toString();
  }

  return url;
}

async function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

async function autoDiscoverUrls(baseUrl) {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  try {
    await page.setViewport({ width: 1450, height: 1080 });
    await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 0 });

    const autoParser = new AutoParser();
    const result = await autoParser.findCategoryAndProduct(page, baseUrl);

    if (result) {
      const urls = [baseUrl];
      if (result.categoryUrl) urls.push(result.categoryUrl);
      if (result.productUrl) urls.push(result.productUrl);
      return urls;
    }

    return [baseUrl];

  } finally {
    await browser.close();
  }
}

async function processUrls() {
  const rawUrls = readUrlsFromFile();
  const processedUrls = [];

  if (rawUrls.length === 1 && rawUrls[0].endsWith('/')) {
    console.log(`🔍 Авто-визначення для ${rawUrls[0]}...`);
    const discoveredUrls = await autoDiscoverUrls(rawUrls[0]);
    processedUrls.push(...discoveredUrls);
  } else {
    for (const url of rawUrls) {
      if (url === 'auto') {
        const baseUrl = rawUrls.find(u => u !== 'auto' && u.endsWith('/'));
        if (baseUrl) {
          console.log(`🔍 Авто-визначення для ${baseUrl}...`);
          const discoveredUrls = await autoDiscoverUrls(baseUrl);
          processedUrls.push(...discoveredUrls);
        } else {
          console.log('❌ Не знайдено базовий URL для авто-визначення');
        }
      } else {
        processedUrls.push(url);
      }
    }
  }

  return processedUrls;
}

const urls = await processUrls();

console.log(`📋 Знайдено ${urls.length} URL для обробки:`);
urls.forEach((url, index) => {
  console.log(`  ${index + 1}. ${url}`);
});
console.log('');

async function takeScreenshots() {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new"
    });

    const languages = ['default', 'en'];
    const devices = ['desktop', 'mobile'];
    const allPromises = [];

    for (const url of urls) {
      for (const language of languages) {
        for (const device of devices) {
          const promise = createScreenshot(browser, url, language, device);
          allPromises.push(promise);
        }
      }
    }

    await Promise.all(allPromises);

    console.log(`🎉 Всі ${allPromises.length} скриншоти успішно створені!`);

  } catch (error) {
    console.error('❌ Помилка:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function createScreenshot(browser, originalUrl, language, device) {
  const page = await browser.newPage();

  try {
    if (device === 'mobile') {
      await page.setViewport({
        width: 375,
        height: 667,
        deviceScaleFactor: 2,
        isMobile: true
      });
      await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1');
    } else {
      await page.setViewport({ width: 1450, height: 1080 });
    }

    const finalUrl = addLanguagePrefix(originalUrl, language);

    await page.goto(finalUrl, { waitUntil: 'networkidle2', timeout: 0 });

    const fileName = generateFileName(originalUrl, device, language, 0);
    const folderPath = `output/${device}/${language}`;
    const screenshotPath = `${folderPath}/${fileName}`;

    await ensureDirectoryExists(folderPath);

    await page.screenshot({ path: screenshotPath, fullPage: true });

    console.log(`✅ ${device.toUpperCase()} ${language.toUpperCase()}: ${finalUrl} -> ${folderPath}/${fileName}`);

  } catch (error) {
    console.error(`❌ Помилка для ${device} ${language} ${originalUrl}:`, error.message);
  } finally {
    await page.close();
  }
}

takeScreenshots();
