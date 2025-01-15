import { Router } from 'express';
import { semanticController } from '../controllers/semantic.controller';

const router = Router();

/**
 * @openapi
 * /api/semantic/businesses:
 *   post:
 *     tags: [SemanticSearch]
 *     summary: Perform a semantic search across businesses
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *     responses:
 *       200:
 *         description: Search results
 */
router.post('/businesses', semanticController.semanticSearchBusinesses);

export const semanticRoutes = router;
