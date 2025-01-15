import { Router } from 'express';
import { businessController } from '../controllers/business.controller';

const router = Router();

/**
 * @openapi
 * /api/businesses/all:
 *   get:
 *     tags: [Businesses]
 *     summary: Get all businesses for initial map load
 *     responses:
 *       200:
 *         description: List of all businesses
 */
router.get('/all', businessController.getAll);

/**
 * @openapi
 * /api/businesses/updates:
 *   get:
 *     tags: [Businesses]
 *     summary: Get business updates since last sync
 *     parameters:
 *       - in: query
 *         name: lastSync
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: List of updated businesses
 */
router.get('/updates', businessController.getUpdates);

/**
 * @openapi
 * /api/businesses/{id}/visited:
 *   patch:
 *     tags: [Businesses]
 *     summary: Update visited status for a business
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               visited:
 *                 type: boolean
 *             required:
 *               - visited
 *     responses:
 *       200:
 *         description: Updated business
 *       400:
 *         description: Invalid request body
 *       404:
 *         description: Business not found
 */
router.patch('/:id/visited', businessController.updateVisited);

/**
 * @openapi
 * /api/businesses/{id}/visited:
 *   patch:
 *     tags: [Businesses]
 *     summary: Update embeddings for some or all businesses
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               businessAliases:
 *                 type: array
 *                 items:
 *                    type: string
 *     responses:
 *       200:
 *         description: Updated business(es)
 *       400:
 *         description: Invalid request body
 *       404:
 *         description: Business not found
 */
router.patch('/updateEmbeddings', businessController.updateEmbeddings);

export const businessRoutes = router;
