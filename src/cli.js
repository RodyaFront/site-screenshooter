import { Command } from 'commander';
import chalk from 'chalk';

export class CLI {
  constructor() {
    this.program = new Command();
    this.setupCommands();
  }

  setupCommands() {
    this.program
      .name('website-screenshooter')
      .description('Автоматичне створення скріншотів веб-сайтів')
      .version('1.0.0');

    this.program
      .option('-c, --config <path>', 'Шлях до конфігураційного файлу', 'config.json')
      .option('-s, --site <name>', 'Обробити тільки вказаний сайт')
      .option('-p, --pages <types>', 'Типи сторінок (через кому): home,category,product', 'home,category,product')
      .option('-l, --languages <langs>', 'Мови (через кому): default,en', 'default,en')
      .option('-d, --devices <devices>', 'Пристрої (через кому): desktop,mobile', 'desktop,mobile')
      .option('-o, --output <dir>', 'Папка для збереження скріншотів', './output')
      .option('--retry <count>', 'Кількість спроб при помилці', '3')
      .option('--delay <ms>', 'Затримка між спробами (мс)', '2000')
      .option('--headless', 'Запуск браузера в headless режимі', true)
      .option('--verbose', 'Детальний вивід', false);
  }

  async handleCommand() {
    try {
      this.program.parse();
      const options = this.program.opts();
      const parsedOptions = this.parseOptions(options);
      this.printStartInfo(parsedOptions);
      return parsedOptions;

    } catch (error) {
      this.printError('Помилка парсингу аргументів:', error.message);
      process.exit(1);
    }
  }

  parseOptions(options) {
    const parsed = {
      config: options.config,
      site: options.site,
      pages: this.parseList(options.pages),
      languages: this.parseList(options.languages),
      devices: this.parseList(options.devices),
      output: options.output,
      retry: parseInt(options.retry),
      delay: parseInt(options.delay),
      headless: options.headless,
      verbose: options.verbose
    };

    this.validateOptions(parsed);
    return parsed;
  }

  parseList(value) {
    if (typeof value === 'string') {
      return value.split(',').map(item => item.trim()).filter(item => item);
    }
    return value;
  }

  validateOptions(options) {
    const validPages = ['home', 'category', 'product'];
    const invalidPages = options.pages.filter(page => !validPages.includes(page));
    if (invalidPages.length > 0) {
      throw new Error(`Невірні типи сторінок: ${invalidPages.join(', ')}. Доступні: ${validPages.join(', ')}`);
    }

    const validLanguages = ['default', 'en'];
    const invalidLanguages = options.languages.filter(lang => !validLanguages.includes(lang));
    if (invalidLanguages.length > 0) {
      throw new Error(`Невірні мови: ${invalidLanguages.join(', ')}. Доступні: ${validLanguages.join(', ')}`);
    }

    const validDevices = ['desktop', 'mobile'];
    const invalidDevices = options.devices.filter(device => !validDevices.includes(device));
    if (invalidDevices.length > 0) {
      throw new Error(`Невірні пристрої: ${invalidDevices.join(', ')}. Доступні: ${validDevices.join(', ')}`);
    }

    if (options.retry < 1 || options.retry > 10) {
      throw new Error('Кількість спроб має бути від 1 до 10');
    }

    if (options.delay < 0 || options.delay > 10000) {
      throw new Error('Затримка має бути від 0 до 10000 мс');
    }
  }

  printStartInfo(options) {
    console.log(chalk.blue.bold('\n🚀 Website Screenshooter'));
    console.log(chalk.gray('================================\n'));

    console.log(chalk.cyan('📋 Конфігурація:'));
    console.log(`   Конфіг: ${chalk.white(options.config)}`);
    console.log(`   Сайт: ${chalk.white(options.site || 'всі')}`);
    console.log(`   Сторінки: ${chalk.white(options.pages.join(', '))}`);
    console.log(`   Мови: ${chalk.white(options.languages.join(', '))}`);
    console.log(`   Пристрої: ${chalk.white(options.devices.join(', '))}`);
    console.log(`   Вихідна папка: ${chalk.white(options.output)}`);
    console.log(`   Спроби: ${chalk.white(options.retry)}`);
    console.log(`   Затримка: ${chalk.white(options.delay)}мс`);
    console.log(`   Headless: ${chalk.white(options.headless ? 'так' : 'ні')}`);
    console.log(`   Детальний вивід: ${chalk.white(options.verbose ? 'так' : 'ні')}\n`);

    const totalTasks = options.pages.length * options.languages.length * options.devices.length;
    const sitesCount = options.site ? 1 : 'всі';

    console.log(chalk.yellow(`📊 Очікується: ${totalTasks} скріншотів на ${sitesCount} сайт(ів)\n`));
  }

  printError(message, details = '') {
    console.error(chalk.red.bold('❌ Помилка:'), chalk.red(message));
    if (details) {
      console.error(chalk.gray(details));
    }
  }

  printSuccess(message) {
    console.log(chalk.green.bold('✅'), chalk.green(message));
  }

  printWarning(message) {
    console.log(chalk.yellow.bold('⚠️'), chalk.yellow(message));
  }

  printInfo(message) {
    console.log(chalk.blue('ℹ️'), chalk.white(message));
  }

  printProgress(current, total, message = '') {
    const percentage = Math.round((current / total) * 100);
    const progressBar = this.createProgressBar(percentage);

    process.stdout.write(`\r${chalk.cyan(progressBar)} ${percentage}% ${message}`);

    if (current === total) {
      process.stdout.write('\n');
    }
  }

  createProgressBar(percentage, length = 30) {
    const filled = Math.round((percentage / 100) * length);
    const empty = length - filled;
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
  }

  printHelp() {
    this.program.help();
  }

  parse() {
    return this.program.parse();
  }
}
