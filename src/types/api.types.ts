import { z } from 'zod';

export const PaginationQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('30'),
});

export const UpdatesQuerySchema = z.object({
  lastSync: z.string().transform((val) => new Date(val)),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
export type UpdatesQuery = z.infer<typeof UpdatesQuerySchema>;
