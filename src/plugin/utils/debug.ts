type LogLevel = 'log' | 'warn' | 'error';

class Debug {
  log(context: string, message: string, ...args: any[]) {
    this.print('log', context, message, args);
  }

  warn(context: string, message: string, ...args: any[]) {
    this.print('warn', context, message, args);
  }

  error(context: string, error: Error) {
    this.print('error', context, error.message);
  }

  private print(level: LogLevel, context: string, message: string, args: any[] = []) {
    console[level](`[${context}] ${message}`, ...args);
  }
}

export const debug = new Debug(); 