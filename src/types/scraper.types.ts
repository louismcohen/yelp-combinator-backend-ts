// types/scraper.types.ts
import { z } from 'zod';

export const ScrapedBusinessSchema = z.object({
  alias: z.string(),
  note: z.string().optional(),
  addedIndex: z.number(),
  collectionId: z.string().optional(),
});

export const ScrapedCollectionSchema = z.object({
  yelpCollectionId: z.string(),
  title: z.string(),
  itemCount: z.number(),
  lastUpdated: z.date(),
  items: z.array(ScrapedBusinessSchema).optional(),
});

export type ScrapedBusiness = z.infer<typeof ScrapedBusinessSchema>;
export type ScrapedCollection = z.infer<typeof ScrapedCollectionSchema>;

// Define a more structured error type
export type ScrapeError = {
  message: string;
  code?: number;
  original?: unknown;
};

// Updated ScrapeResult type
export type ScrapeResult<T> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: string };
