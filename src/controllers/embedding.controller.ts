import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { z } from 'zod';
import { generateEmbedding } from '../services/embedding.service';

const GenerateEmbeddingSchema = z.object({
  text: z.string().trim().min(1, { message: 'Must include some sort of text' }),
});

export const embeddingController = {
  generateEmbedding: asyncHandler(async (req: Request, res: Response) => {
    const { text } = GenerateEmbeddingSchema.parse(req.body);
    const embedding = await generateEmbedding(text);
    res.json(embedding);
  }),
};
