import { Request, Response } from 'express';
import { z } from 'zod';
import { businessService } from '../services/business.service';
import { asyncHandler, createError } from '../utils/asyncHandler';
import { BusinessModel } from '../models/Business';
import { VisitedUpdateSchema } from '../types/schemas';

const UpdatesQuerySchema = z.object({
  lastSync: z.string().transform((val) => new Date(val)),
});

const UpdateEmbeddingsSchema = z.object({
  businessAliases: z.array(z.string()).optional(),
});

export const businessController = {
  getAll: asyncHandler(async (_req: Request, res: Response) => {
    const businesses = await businessService.getAll();
    res.json(businesses);
  }),

  getUpdates: asyncHandler(async (req: Request, res: Response) => {
    const { lastSync } = UpdatesQuerySchema.parse(req.query);
    const updates = await businessService.getUpdates(lastSync);
    res.json(updates);
  }),
  updateVisited: asyncHandler(async (req: Request, res: Response) => {
    const { visited } = VisitedUpdateSchema.parse(req.body);

    const business = await BusinessModel.findOneAndUpdate(
      { alias: req.params.alias },
      { visited },
      { new: true }, // Return updated document
    );

    if (!business) {
      throw createError(404, 'Business not found');
    }

    res.json(business);
  }),
  updateEmbeddings: asyncHandler(async (req: Request, res: Response) => {
    const { businessAliases } = UpdateEmbeddingsSchema.parse(req.body);
    const updatedBusinesses =
      await businessService.updateEmbeddings(businessAliases);
    res.json(updatedBusinesses);
  }),
};
