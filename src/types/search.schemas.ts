import { z } from 'zod';

export const ViewportSchema = z
  .object({
    southwest: z.array(z.number()).length(2),
    northeast: z.array(z.number()).length(2),
  })
  .refine((data) => {
    return (
      data.northeast[0] > data.southwest[0] &&
      data.northeast[1] > data.southwest[1] &&
      data.northeast[0] >= -180 &&
      data.northeast[0] <= 180 &&
      data.southwest[0] >= -180 &&
      data.southwest[0] <= 180
    );
  }, 'Invalid viewport coordinates');

export const SearchRequestSchema = z.object({
  query: z.string().min(1),
  viewport: ViewportSchema.optional(),
  userLocation: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
    })
    .optional(),
});

export const SearchConfigSchema = z.object({
  textSearch: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  visited: z.boolean().optional(),
  isClaimed: z.boolean().optional(),
  shouldCheckHours: z.boolean().optional(),
  useProximity: z.boolean().optional(),
  location: z
    .object({
      near: z.tuple([z.number(), z.number()]),
      maxDistance: z.number().optional(),
    })
    .optional(),
});

export type Viewport = z.infer<typeof ViewportSchema>;
export type SearchRequest = z.infer<typeof SearchRequestSchema>;
export type SearchConfig = z.infer<typeof SearchConfigSchema>;
