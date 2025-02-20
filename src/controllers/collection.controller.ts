import { Request, Response } from 'express';
import { z } from 'zod';
import { collectionService } from '../services/collection.service';
import { asyncHandler, createError } from '../utils/asyncHandler';

const CollectionIdsSchema = z.object({
  collectionIds: z.array(z.string()).optional(),
  generateEmbeddings: z.boolean().optional(),
});

const AddCollectionSchema = z.object({
  collectionId: z.string(),
  generateEmbedding: z.boolean().optional(),
});

export const collectionController = {
  syncCollections: asyncHandler(async (req: Request, res: Response) => {
    const { collectionIds, generateEmbeddings } = CollectionIdsSchema.parse(
      req.body,
    );
    const results = await collectionService.syncCollections(
      collectionIds,
      generateEmbeddings,
    );
    res.json(results);
  }),

  checkUpdates: asyncHandler(async (req: Request, res: Response) => {
    const { collectionIds } = CollectionIdsSchema.parse(req.body);
    const updates = await collectionService.checkForUpdates(collectionIds);
    res.json(updates);
  }),

  getCollection: asyncHandler(async (req: Request, res: Response) => {
    const collection = await collectionService.getCollection(req.params.id);
    res.json(collection);
  }),

  addCollection: asyncHandler(async (req: Request, res: Response) => {
    const { collectionId, generateEmbedding } = AddCollectionSchema.parse(
      req.body,
    );

    // Check if collection already exists
    const existing = await collectionService.findByYelpId(collectionId);
    if (existing) {
      throw createError(409, 'Collection already exists');
    }

    // Add and sync collection
    const result = await collectionService.addAndSyncCollection(
      collectionId,
      generateEmbedding,
    );

    res.status(201).json(result);
  }),
};
