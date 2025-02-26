import { Router } from 'express';
import { embeddingController } from '../controllers/embedding.controller';

const router = Router();

/**
 * @openapi
 * /api/embeddings:
 *   post:
 *     tags: [Embeddings]
 *     summary: Generate embedding for provided text
 *     description: Convert text into a vector embedding for semantic search
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 description: Text to convert to embedding vector
 *             required:
 *               - text
 *     responses:
 *       200:
 *         description: Embedding vector generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 embedding:
 *                   type: array
 *                   items:
 *                     type: number
 *                   description: Vector representation of the input text
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.post('/', embeddingController.generateEmbedding);

export const embeddingRoutes = router;
