import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.string().default('3000'),
  MONGODB_URI: z.string(),
  YELP_API_KEY: z.string(),
  ANTHROPIC_API_KEY: z.string(),
});

export const env = envSchema.parse(process.env);
