/**
 * Frontend logging utilities for TrainStation.
 * 
 * This module provides structured logging capabilities for the frontend,
 * sending logs to the backend API which forwards them to SEQ for centralized
 * log management and analysis.
 */

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp?: Date;
  context?: Record<string, any>;
  source?: string;
  userAgent?: string;
  url?: string;
  errorStack?: string;
}

export interface LogBatch {
  logs: LogEntry[];
}

class Logger {
  private logBuffer: LogEntry[] = [];
  private readonly bufferSize = 10;
  private readonly flushInterval = 5000; // 5 seconds
  private flushTimer?: NodeJS.Timeout;
  private readonly apiBaseUrl: string;

  constructor() {
    // Get API base URL from environment or default
    this.apiBaseUrl = import.meta.env.VITE_API_BASE || '/api';
    
    // Start periodic flush
    this.startPeriodicFlush();
    
    // Flush logs before page unload
    window.addEventListener('beforeunload', () => {
      this.flush(true); // Synchronous flush
    });
  }

  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  private createLogEntry(
    level: LogEntry['level'],
    message: string,
    context?: Record<string, any>
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date(),
      context: {
        ...context,
        component: this.getCallerInfo(),
      },
      source: 'frontend',
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
  }

  private getCallerInfo(): string {
    try {
      const stack = new Error().stack;
      if (stack) {
        const lines = stack.split('\n');
        // Get the caller (skip createLogEntry, the log method, and Error constructor)
        const callerLine = lines[4] || lines[3] || 'unknown';
        const match = callerLine.match(/at (.+) \(/);
        return match ? match[1] : 'unknown';
      }
    } catch {
      // Ignore errors in getting caller info
    }
    return 'unknown';
  }

  debug(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry('debug', message, context);
    this.addToBuffer(entry);
  }

  info(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry('info', message, context);
    this.addToBuffer(entry);
  }

  warn(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry('warn', message, context);
    this.addToBuffer(entry);
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    const entry = this.createLogEntry('error', message, context);
    
    if (error) {
      entry.errorStack = error.stack;
      entry.context = {
        ...entry.context,
        errorName: error.name,
        errorMessage: error.message,
      };
    }
    
    this.addToBuffer(entry);
    
    // Immediately flush error logs
    this.flush();
  }

  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);
    
    // Auto-flush if buffer is full
    if (this.logBuffer.length >= this.bufferSize) {
      this.flush();
    }
  }

  async flush(synchronous = false): Promise<void> {
    if (this.logBuffer.length === 0) {
      return;
    }

    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    const batch: LogBatch = { logs: logsToSend };

    try {
      const url = `${this.apiBaseUrl}/logging/submit`;
      
      if (synchronous) {
        // Use sendBeacon for synchronous sending during page unload
        const data = JSON.stringify(batch);
        const blob = new Blob([data], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
      } else {
        // Use fetch for normal async sending
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(batch),
        });

        if (!response.ok) {
          console.warn('Failed to send logs to backend:', response.statusText);
        }
      }
    } catch (error) {
      console.warn('Error sending logs to backend:', error);
      // Re-add logs to buffer for retry (but limit to prevent infinite growth)
      if (this.logBuffer.length < this.bufferSize * 2) {
        this.logBuffer.unshift(...logsToSend);
      }
    }
  }

  // Manual flush method for immediate sending
  async flushNow(): Promise<void> {
    await this.flush();
  }
}

// Create singleton logger instance
const logger = new Logger();

// Log uncaught errors
window.addEventListener('error', (event) => {
  logger.error('Uncaught error', event.error, {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});

// Log unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection', event.reason, {
    type: 'unhandledrejection',
  });
});

export default logger;

// Also export convenience functions
export const log = {
  debug: (message: string, context?: Record<string, any>) => logger.debug(message, context),
  info: (message: string, context?: Record<string, any>) => logger.info(message, context),
  warn: (message: string, context?: Record<string, any>) => logger.warn(message, context),
  error: (message: string, error?: Error, context?: Record<string, any>) => logger.error(message, error, context),
  flush: () => logger.flushNow(),
};