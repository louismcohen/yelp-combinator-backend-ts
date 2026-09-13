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
  HF_TOKEN: z.string(),
  YELP_GQL_COLLECTION_ITEMS_DOCUMENT_ID: z
    .string()
    .default(
      'dc87c0c78c2d4cc684b360f27e502a44de226e69eb17b9383a99d612141617c3',
    ),
  YELP_SCRAPER_RENDERED_ITEMS_FALLBACK: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
});

export const env = envSchema.parse(process.env);
