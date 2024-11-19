// src/utils/logger.ts
export class Logger {
  static log(level: string, message: string, meta: Record<string, any> = {}) {
    const timestamp = new Date().toISOString();
    const logMessage = {
      timestamp,
      level,
      project: "DeployNow Bot",
      message,
      ...meta,
    };
    console.log(JSON.stringify(logMessage, null, 2));
  }

  static info(message: string, meta: Record<string, any> = {}) {
    this.log("INFO", message, meta);
  }

  static warn(message: string, meta: Record<string, any> = {}) {
    this.log("WARN", message, meta);
  }

  static error(message: string, meta: Record<string, any> = {}) {
    this.log("ERROR", message, meta);
  }
}
