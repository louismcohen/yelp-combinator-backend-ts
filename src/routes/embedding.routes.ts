import { Router } from 'express';
import { embeddingController } from '../controllers/embedding.controller';

const router = Router();

/**
 * @openapi
 * /api/embeddings:
 *   post:
 *     tags: [Embeddings]
 *     summary: Generate embedding for provided text
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Embedding vector generated
 */
router.post('/', embeddingController.generateEmbedding);

export const embeddingRoutes = router;
