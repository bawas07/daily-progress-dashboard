import { Prisma, PrismaClient, User } from '@prisma/client';
import { Container, resolveService } from '../../../shared/container';

export interface CreateUserData {
  email: string;
  passwordHash: string;
  name: string;
}

export class UserRepository {
  private prisma: PrismaClient;

  constructor(container: Container) {
    const databaseService = resolveService<{ client: PrismaClient }>('DatabaseService', container);
    this.prisma = databaseService.client;
  }

  async findById(id: string): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(`Database error finding user ${id}: ${error.message} [${error.code}]`);
      }
      if (error instanceof Error) {
        throw new Error(`Database error finding user ${id}: ${error.message}`);
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.prisma.user.findFirst({
        where: { email },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(`Database error finding user by email ${email}: ${error.message} [${error.code}]`);
      }
      if (error instanceof Error) {
        throw new Error(`Database error finding user by email ${email}: ${error.message}`);
      }
      throw error;
    }
  }

  async create(data: CreateUserData): Promise<User> {
    try {
      return await this.prisma.user.create({
        data: {
          email: data.email,
          passwordHash: data.passwordHash,
          name: data.name,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(`Database error creating user ${data.email}: ${error.message} [${error.code}]`);
      }
      if (error instanceof Error) {
        throw new Error(`Database error creating user ${data.email}: ${error.message}`);
      }
      throw error;
    }
  }

  async updateLastLogin(userId: string): Promise<User> {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: { lastLogin: new Date() },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(`Database error updating last login for user ${userId}: ${error.message} [${error.code}]`);
      }
      if (error instanceof Error) {
        throw new Error(`Database error updating last login for user ${userId}: ${error.message}`);
      }
      throw error;
    }
  }

  async delete(userId: string): Promise<User> {
    try {
      return await this.prisma.user.delete({
        where: { id: userId },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(`Database error deleting user ${userId}: ${error.message} [${error.code}]`);
      }
      if (error instanceof Error) {
        throw new Error(`Database error deleting user ${userId}: ${error.message}`);
      }
      throw error;
    }
  }
}
