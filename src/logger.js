import fs from 'fs';
import path from 'path';

export class Logger {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.logFile = options.logFile || null;
    this.logs = [];
    this.startTime = Date.now();
  }

  info(message, data = null) {
    this.log('INFO', message, data);
  }

  warn(message, data = null) {
    this.log('WARN', message, data);
  }

  error(message, data = null) {
    this.log('ERROR', message, data);
  }

  success(message, data = null) {
    this.log('SUCCESS', message, data);
  }

  debug(message, data = null) {
    if (this.verbose) {
      this.log('DEBUG', message, data);
    }
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
      elapsed: Date.now() - this.startTime
    };

    this.logs.push(logEntry);
    this.printToConsole(logEntry);

    if (this.logFile) {
      this.writeToFile(logEntry);
    }
  }

  printToConsole(logEntry) {
    const { timestamp, level, message, elapsed } = logEntry;
    const timeStr = new Date(timestamp).toLocaleTimeString();
    const elapsedStr = `${elapsed}ms`;

    let levelColor = '';
    let levelSymbol = '';

    switch (level) {
      case 'INFO':
        levelColor = '\x1b[36m';
        levelSymbol = 'ℹ️';
        break;
      case 'WARN':
        levelColor = '\x1b[33m';
        levelSymbol = '⚠️';
        break;
      case 'ERROR':
        levelColor = '\x1b[31m';
        levelSymbol = '❌';
        break;
      case 'SUCCESS':
        levelColor = '\x1b[32m';
        levelSymbol = '✅';
        break;
      case 'DEBUG':
        levelColor = '\x1b[90m';
        levelSymbol = '🐛';
        break;
    }

    const resetColor = '\x1b[0m';
    const output = `${levelColor}${levelSymbol} [${timeStr}] ${message}${resetColor}`;

    if (this.verbose || level !== 'DEBUG') {
      console.log(output);
    }

    if (logEntry.data && this.verbose) {
      console.log(JSON.stringify(logEntry.data, null, 2));
    }
  }

  writeToFile(logEntry) {
    try {
      const logLine = JSON.stringify(logEntry) + '\n';
      fs.appendFileSync(this.logFile, logLine);
    } catch (error) {
      console.error('Помилка запису в лог файл:', error.message);
    }
  }

  createLogFile(outputDir) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.logFile = path.join(outputDir, `screenshooter-${timestamp}.log`);

    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    this.info(`Лог файл створено: ${this.logFile}`);
  }

  logTaskStart(taskInfo) {
    this.info(`Починаємо: ${taskInfo.description}`, {
      url: taskInfo.url,
      site: taskInfo.siteName,
      language: taskInfo.language,
      device: taskInfo.device,
      pageType: taskInfo.pageType
    });
  }

  logTaskComplete(taskInfo, success, attempts = 1) {
    if (success) {
      this.success(`Завершено: ${taskInfo.description} (${attempts} спроба)`, {
        fileName: taskInfo.fileName
      });
    } else {
      this.error(`Помилка: ${taskInfo.description} (${attempts} спроб)`, {
        error: taskInfo.error
      });
    }
  }

  logProgress(current, total, currentTask = '') {
    const percentage = Math.round((current / total) * 100);
    const progressBar = this.createProgressBar(percentage);

    process.stdout.write(`\r${progressBar} ${percentage}% (${current}/${total}) ${currentTask}`);

    if (current === total) {
      process.stdout.write('\n');
    }
  }

  createProgressBar(percentage, length = 30) {
    const filled = Math.round((percentage / 100) * length);
    const empty = length - filled;
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
  }

  logStats(stats) {
    this.info('📊 Статистика виконання:');
    console.log(`   Всього завдань: ${stats.total}`);
    console.log(`   Успішно: ${stats.successful}`);
    console.log(`   Помилок: ${stats.failed}`);
    console.log(`   Успішність: ${stats.successRate}%`);

    if (stats.bySite) {
      console.log('\n   По сайтах:');
      Object.entries(stats.bySite).forEach(([site, siteStats]) => {
        console.log(`     ${site}: ${siteStats.successful}/${siteStats.total} (${Math.round(siteStats.successful/siteStats.total*100)}%)`);
      });
    }
  }

  logErrors(errors) {
    if (errors.length === 0) {
      this.success('Помилок не було!');
      return;
    }

    this.error(`Знайдено ${errors.length} помилок:`);
    errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error.site} - ${error.language}/${error.device}/${error.page}`);
      console.log(`      URL: ${error.url}`);
      console.log(`      Помилка: ${error.error}`);
      console.log(`      Спроби: ${error.attempts}\n`);
    });
  }

  getLogs() {
    return this.logs;
  }

  getLogsByLevel(level) {
    return this.logs.filter(log => log.level === level);
  }

  clearLogs() {
    this.logs = [];
  }

  saveLogsToFile(filePath) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(this.logs, null, 2));
      this.info(`Логи збережено в: ${filePath}`);
    } catch (error) {
      this.error(`Помилка збереження логів: ${error.message}`);
    }
  }
}
