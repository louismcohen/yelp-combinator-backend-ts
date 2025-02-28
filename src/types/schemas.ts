import { z } from 'zod';

export const BusinessSchema = z.object({
  _id: z.string().optional(),
  alias: z.string(),
  note: z.string().optional(),
  addedIndex: z.number(),
  url: z.string().url(),
  lastUpdated: z.date(),
  visited: z.boolean().default(false),
  collectionId: z.string(),
  geoPoint: z.object({
    type: z.literal('Point'),
    coordinates: z.array(z.number(), z.number()),
  }),
  embedding: z.array(z.number().finite()).length(384).optional(),
  yelpData: z
    .object({
      name: z.string(),
      image_url: z.string().url().optional(),
      is_claimed: z.boolean(),
      is_closed: z.boolean().optional(),
      rating: z.number().optional(),
      review_count: z.number().optional(),
      price: z.string().optional(),
      phone: z.string().optional(),
      display_phone: z.string().optional(),
      coordinates: z.object({
        latitude: z.number(),
        longitude: z.number(),
      }),
      location: z.object({
        address1: z.string(),
        city: z.string(),
        state: z.string(),
        zip_code: z.string(),
        display_address: z.array(z.string()),
        timezone: z.string().optional(),
      }),
      categories: z.array(
        z.object({
          alias: z.string(),
          title: z.string(),
        }),
      ),
      photos: z.array(z.string()),
      hours: z
        .array(
          z.object({
            open: z.array(
              z.object({
                start: z.string(),
                end: z.string(),
                day: z.number(),
                is_overnight: z.boolean(),
              }),
            ),
          }),
        )
        .optional(),
    })
    .optional(),
});

export const CollectionSchema = z.object({
  _id: z.string().optional(),
  yelpCollectionId: z.string(),
  title: z.string(),
  itemCount: z.number(),
  lastUpdated: z.date(),
  businesses: z.array(z.string()),
});

export const VisitedUpdateSchema = z.object({
  visited: z.boolean(),
});

export type Business = z.infer<typeof BusinessSchema>;
export type Collection = z.infer<typeof CollectionSchema>;
export type VisitedUpdateSchema = z.infer<typeof VisitedUpdateSchema>;
