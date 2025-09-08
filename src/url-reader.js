import fs from 'fs';

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

  hasOnlyRootUrl(urls) {
    return urls.length === 1 && urls[0].endsWith('/');
  }

  findBaseUrlForAuto(urls) {
    return urls.find(u => u !== 'auto' && u.endsWith('/'));
  }
}
