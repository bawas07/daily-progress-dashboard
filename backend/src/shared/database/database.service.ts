import { PrismaClient } from '@prisma/client';
import { logger } from '../logger/logger.service';
import { env } from '../config/env';

export class DatabaseService {
  private prisma: PrismaClient;

  constructor() {
    // Only log queries in development to avoid performance/security issues in production
    const logOptions = env.NODE_ENV === 'development'
      ? ['query', 'info', 'warn', 'error']
      : ['error'];

    this.prisma = new PrismaClient({
      log: logOptions,
    });
  }

  async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      logger.info('Database connection established');
    } catch (error) {
      logger.error('Failed to connect to database', { error });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
    logger.info('Database connection closed');
  }

  get client(): PrismaClient {
    return this.prisma;
  }
}

export const databaseService = new DatabaseService();
