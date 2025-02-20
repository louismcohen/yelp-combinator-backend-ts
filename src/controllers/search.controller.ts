import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { SearchRequestSchema } from '../types/search.schemas';
import { searchService } from '../services/search.service';

export const searchController = {
  search: asyncHandler(async (req: Request, res: Response) => {
    const { query, viewport, userLocation } = SearchRequestSchema.parse(
      req.body,
    );

    const results = await searchService.processSearch(
      query,
      viewport,
      userLocation,
    );

    res.json(results);
  }),
};
