import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

// Define environment schema
const envSchema = z.object({
  // Required
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  
  // Optional with defaults
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

// Parse and validate environment variables
const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('❌ Invalid environment variables:');
  console.error(result.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = result.data;

// Log loaded config (without secrets)
console.log('✅ Environment variables loaded:', {
  NODE_ENV: env.NODE_ENV,
  PORT: env.PORT,
  LOG_LEVEL: env.LOG_LEVEL,
  DATABASE_URL: '[REDACTED]',
  JWT_SECRET: '[REDACTED]',
});
