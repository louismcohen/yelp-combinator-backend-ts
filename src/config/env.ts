import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.string().default('3000'),
  MONGODB_URI: z.string(),
  MONGODB_STD_URI: z.string(),
  YELP_API_KEY: z.string(),
  ANTHROPIC_API_KEY: z.string(),
  ANTHROPIC_MODEL: z.string(),
  POSTMAN_API_KEY: z.string(),
  POSTMAN_COLLECTION_UID: z.string(),
  MONGODB_OLD_URI: z.string(),
});

export const env = envSchema.parse(process.env);
