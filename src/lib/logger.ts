type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  userId?: string;
  endpoint?: string;
  method?: string;
  duration?: number;
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  info(message: string, context?: LogContext) {
    const formatted = this.formatMessage('info', message, context);
    console.log(formatted);
  }

  warn(message: string, context?: LogContext) {
    const formatted = this.formatMessage('warn', message, context);
    console.warn(formatted);
  }

  error(message: string, error?: Error, context?: LogContext) {
    const errorContext = error ? { ...context, error: error.message, stack: error.stack } : context;
    const formatted = this.formatMessage('error', message, errorContext);
    console.error(formatted);
  }

  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      const formatted = this.formatMessage('debug', message, context);
      console.debug(formatted);
    }
  }

  apiRequest(method: string, endpoint: string, userId?: string) {
    this.info('API Request', { method, endpoint, userId });
  }

  apiResponse(method: string, endpoint: string, status: number, duration: number, userId?: string) {
    this.info('API Response', { method, endpoint, status, duration, userId });
  }

  apiError(method: string, endpoint: string, error: Error, userId?: string) {
    this.error('API Error', error, { method, endpoint, userId });
  }
}

export const logger = new Logger();