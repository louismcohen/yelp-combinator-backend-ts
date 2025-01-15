import { Request, Response } from 'express';
import { z } from 'zod';
import { semanticService } from '../services/semantic.service';
import { asyncHandler } from '../utils/asyncHandler';
import { BusinessModel } from '../models/Business';
import { Business } from '../types/schemas';

const SemanticSearchSchema = z.object({
  query: z
    .string()
    .trim()
    .min(1, { message: 'Query must include some sort of text' }),
});

export const semanticController = {
  semanticSearchBusinesses: asyncHandler(
    async (req: Request, res: Response) => {
      const { query } = SemanticSearchSchema.parse(req.body);
      const results = await semanticService.search<Business>(
        query,
        BusinessModel,
      );
      console.log(
        `${results.length} results for query ${query}`,
        results.map((result) => ({
          name: result.document.yelpData?.name,
          note: result.document.note,
          rating: result.document.yelpData?.rating,
          reviews: result.document.yelpData?.review_count,
        })),
      );
      res.json(results);
    },
  ),
};
