import { Router } from 'express';
import { searchController } from '../controllers/search.controller';

const router = Router();

/**
 * @openapi
 * /api/search:
 *   post:
 *     tags: [Search]
 *     summary: Search businesses using natural language
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *               viewport:
 *                 type: object
 *               userLocation:
 *                 type: object
 *     responses:
 *       200:
 *         description: Search results
 */
router.post('/', searchController.search);

export const searchRoutes = router;
