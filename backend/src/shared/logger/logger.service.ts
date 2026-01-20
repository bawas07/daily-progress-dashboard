import winston from 'winston';
import { env } from '../config/env';

// Custom format for structured logging
const structuredFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Create logger instance
export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: structuredFormat,
  defaultMeta: { service: 'daily-progress-api' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: env.NODE_ENV === 'development' ? consoleFormat : structuredFormat,
    }),
  ],
});

// Re-export with type for convenience
type Logger = winston.Logger;
export type { Logger };


// Convenience methods
export const logError = (message: string, meta?: Record<string, any>) =>
  logger.error(message, meta);

export const logWarn = (message: string, meta?: Record<string, any>) =>
  logger.warn(message, meta);

export const logInfo = (message: string, meta?: Record<string, any>) =>
  logger.info(message, meta);

export const logDebug = (message: string, meta?: Record<string, any>) =>
  logger.debug(message, meta);
