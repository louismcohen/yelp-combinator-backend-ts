import { Router } from 'express';
import { collectionController } from '../controllers/collection.controller';

const router = Router();

/**
 * @openapi
 * /api/collections/sync:
 *   post:
 *     tags: [Collections]
 *     summary: Sync multiple collections from Yelp. Leave request body blank to sync all
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               collectionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Sync results for each collection
 */
router.post('/sync', collectionController.syncCollections);

/**
 * @openapi
 * /api/collections/check-updates:
 *   post:
 *     tags: [Collections]
 *     summary: Check which collections need updates
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               collectionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: List of collections needing updates
 */
router.post('/check-updates', collectionController.checkUpdates);

/**
 * @openapi
 * /api/collections/check-and-sync-updates:
 *   post:
 *     tags: [Collections]
 *     summary: Check for updates and sync collections if needed
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               collectionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               generateEmbeddings:
 *                 type: boolean
 *               updateYelpData:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Sync results for updated collections
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   collectionId:
 *                     type: string
 *                   status:
 *                     type: string
 *                   collection:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       yelpCollectionId:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       lastUpdated:
 *                         type: string
 *                       businesses:
 *                         type: array
 *                         items:
 *                           type: string
 *                   businessesProcessed:
 *                     type: integer
 *                   businessesUpdated:
 *                     type: integer
 *                   updatedBusinesses:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         alias:
 *                           type: string
 *                         name:
 *                           type: string
 *                         lastUpdated:
 *                           type: string
 *                   totalItems:
 *                     type: integer
 *                   error:
 *                     type: string
 */
router.post(
  '/check-and-sync-updates',
  collectionController.checkAndSyncUpdates,
);

/**
 * @openapi
 * /api/collections/{id}:
 *   get:
 *     tags: [Collections]
 *     summary: Get a single collection with its businesses
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Collection details with businesses
 */
router.get('/:id', collectionController.getCollection);

/**
 * @openapi
 * /api/collections:
 *   post:
 *     tags: [Collections]
 *     summary: Add a new collection by ID and perform initial sync
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               collectionId:
 *                 type: string
 *             required:
 *               - collectionId
 *     responses:
 *       201:
 *         description: Collection added and synced successfully
 *       400:
 *         description: Invalid collection ID or scraping failed
 *       409:
 *         description: Collection already exists
 */
router.post('/', collectionController.addCollection);

export const collectionRoutes = router;
