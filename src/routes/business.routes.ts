import { Router } from 'express';
import { businessController } from '../controllers/business.controller';

const router = Router();

/**
 * @openapi
 * /api/businesses/all:
 *   get:
 *     tags: [Businesses]
 *     summary: Get all businesses for initial map load
 *     description: Returns a list of all businesses with their basic information for map display
 *     responses:
 *       200:
 *         description: List of all businesses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: Business ID
 *                   alias:
 *                     type: string
 *                     description: Yelp business alias
 *                   name:
 *                     type: string
 *                     description: Business name
 *                   visited:
 *                     type: boolean
 *                     description: Whether the business has been visited
 *                   geoPoint:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         example: Point
 *                       coordinates:
 *                         type: array
 *                         items:
 *                           type: number
 *                         example: [-122.4194, 37.7749]
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
router.get('/all', businessController.getAll);

/**
 * @openapi
 * /api/businesses/updates:
 *   get:
 *     tags: [Businesses]
 *     summary: Get business updates since last sync
 *     description: Returns businesses that have been updated since the provided timestamp
 *     parameters:
 *       - in: query
 *         name: lastSync
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Timestamp of last synchronization
 *         example: "2023-01-01T00:00:00Z"
 *     responses:
 *       200:
 *         description: List of updated businesses
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
 *                   lastUpdated:
 *                     type: string
 *                     format: date-time
 *       400:
 *         description: Invalid lastSync parameter
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
router.get('/updates', businessController.getUpdates);

/**
 * @openapi
 * /api/businesses/{id}/visited:
 *   patch:
 *     tags: [Businesses]
 *     summary: Update visited status for a business
 *     description: Mark a business as visited or not visited
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Business ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               visited:
 *                 type: boolean
 *                 description: New visited status
 *             required:
 *               - visited
 *     responses:
 *       200:
 *         description: Updated business
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 alias:
 *                   type: string
 *                 name:
 *                   type: string
 *                 visited:
 *                   type: boolean
 *                 lastUpdated:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid request body
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Business not found
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
router.patch('/:id/visited', businessController.updateVisited);

/**
 * @openapi
 * /api/businesses/updateEmbeddings:
 *   patch:
 *     tags: [Businesses]
 *     summary: Update embeddings for some or all businesses
 *     description: Generate or update vector embeddings for specified businesses or all businesses if none specified
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
 *                   type: string
 *                 description: List of business aliases to update embeddings for. If empty, updates all businesses.
 *     responses:
 *       200:
 *         description: Updated business(es)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 matchedCount:
 *                   type: integer
 *                   description: Number of documents matched
 *                 modifiedCount:
 *                   type: integer
 *                   description: Number of documents modified
 *                 upsertedCount:
 *                   type: integer
 *                   description: Number of documents upserted
 *       400:
 *         description: Invalid request body
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Business not found
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
router.patch('/updateEmbeddings', businessController.updateEmbeddings);

export const businessRoutes = router;
