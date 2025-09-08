export class Logger {
  static success(message) {
    console.log(`✅ ${message}`);
  }

  static error(message) {
    console.error(`❌ ${message}`);
  }

  static info(message) {
    console.log(`ℹ️ ${message}`);
  }

  static warning(message) {
    console.log(`⚠️ ${message}`);
  }

  static search(message) {
    console.log(`🔍 ${message}`);
  }

  static waiting(message) {
    console.log(`⏳ ${message}`);
  }

  static list(message) {
    console.log(`📋 ${message}`);
  }

  static celebration(message) {
    console.log(`🎉 ${message}`);
  }
}
