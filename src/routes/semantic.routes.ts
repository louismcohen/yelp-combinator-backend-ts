import { Router } from 'express';
import { semanticController } from '../controllers/semantic.controller';

const router = Router();

/**
 * @openapi
 * /api/semantic/businesses:
 *   post:
 *     tags: [SemanticSearch]
 *     summary: Perform a semantic search across businesses
 *     description: Search businesses using natural language understanding and vector similarity
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *                 description: Natural language search query
 *               limit:
 *                 type: integer
 *                 description: Maximum number of results to return
 *                 default: 10
 *             required:
 *               - query
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   alias:
 *                     type: string
 *                   name:
 *                     type: string
 *                   visited:
 *                     type: boolean
 *                   note:
 *                     type: string
 *                   yelpData:
 *                     type: object
 *                   score:
 *                     type: number
 *                     description: Similarity score (higher is better)
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
router.post('/businesses', semanticController.semanticSearchBusinesses);

export const semanticRoutes = router;
