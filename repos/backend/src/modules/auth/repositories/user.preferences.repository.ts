import { Prisma, PrismaClient, UserPreferences } from '@prisma/client';
import { Container, resolveService } from '../../../shared/container';

export interface UpdatePreferencesData {
  defaultActiveDays?: string[];
  theme?: string;
  timezone?: string;
  enableNotifications?: boolean;
}

export class UserPreferencesRepository {
  private prisma: PrismaClient;

  constructor(container: Container) {
    const databaseService = resolveService<{ client: PrismaClient }>('DatabaseService', container);
    this.prisma = databaseService.client;
  }

  async findByUserId(userId: string): Promise<UserPreferences | null> {
    try {
      return await this.prisma.userPreferences.findUnique({
        where: { userId },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(`Database error finding preferences for user ${userId}: ${error.message} [${error.code}]`);
      }
      if (error instanceof Error) {
        throw new Error(`Database error finding preferences for user ${userId}: ${error.message}`);
      }
      throw error;
    }
  }

  async create(userId: string): Promise<UserPreferences> {
    try {
      return await this.prisma.userPreferences.create({
        data: {
          userId,
          defaultActiveDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
          theme: 'auto',
          timezone: 'UTC',
          enableNotifications: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(`Database error creating preferences for user ${userId}: ${error.message} [${error.code}]`);
      }
      if (error instanceof Error) {
        throw new Error(`Database error creating preferences for user ${userId}: ${error.message}`);
      }
      throw error;
    }
  }

  async update(userId: string, data: UpdatePreferencesData): Promise<UserPreferences> {
    try {
      return await this.prisma.userPreferences.update({
        where: { userId },
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(`Database error updating preferences for user ${userId}: ${error.message} [${error.code}]`);
      }
      if (error instanceof Error) {
        throw new Error(`Database error updating preferences for user ${userId}: ${error.message}`);
      }
      throw error;
    }
  }
}
