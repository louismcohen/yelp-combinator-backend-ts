import { Router } from 'express';
import { collectionController } from '../controllers/collection.controller';

const router = Router();

/**
 * @openapi
 * /api/collections/sync:
 *   post:
 *     tags: [Collections]
 *     summary: Sync multiple collections from Yelp
 *     description: Synchronize specified collections or all collections if none specified
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
 *                 description: List of collection IDs to sync. If empty, syncs all collections.
 *               generateEmbeddings:
 *                 type: boolean
 *                 description: Whether to generate embeddings for businesses
 *                 default: false
 *               updateYelpData:
 *                 type: boolean
 *                 description: Whether to update Yelp data for businesses
 *                 default: true
 *     responses:
 *       200:
 *         description: Sync results for each collection
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
 *                     enum: [success, error]
 *                   collection:
 *                     type: object
 *                   businessesProcessed:
 *                     type: integer
 *                   businessesUpdated:
 *                     type: integer
 *                   updatedBusinesses:
 *                     type: array
 *                     items:
 *                       type: object
 *                   totalItems:
 *                     type: integer
 *                   error:
 *                     type: string
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
router.post('/sync', collectionController.syncCollections);

/**
 * @openapi
 * /api/collections/check-updates:
 *   post:
 *     tags: [Collections]
 *     summary: Check which collections need updates
 *     description: Check if specified collections or all collections need updates from Yelp
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
 *                 description: List of collection IDs to check. If empty, checks all collections.
 *     responses:
 *       200:
 *         description: List of collections needing updates
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   collectionId:
 *                     type: string
 *                     description: Yelp collection ID
 *                   name:
 *                     type: string
 *                     description: Collection name
 *                   needsUpdate:
 *                     type: boolean
 *                     description: Whether the collection needs an update
 *                   lastUpdated:
 *                     type: string
 *                     format: date-time
 *                     description: When the collection was last updated
 *                   currentItemCount:
 *                     type: integer
 *                     description: Current number of businesses in the collection
 *                   yelpItemCount:
 *                     type: integer
 *                     description: Number of businesses in the Yelp collection
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
 *     description: Retrieve detailed information about a collection including all its businesses
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Yelp collection ID
 *     responses:
 *       200:
 *         description: Collection details with businesses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 yelpCollectionId:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 lastUpdated:
 *                   type: string
 *                   format: date-time
 *                 businesses:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       alias:
 *                         type: string
 *                       name:
 *                         type: string
 *                       visited:
 *                         type: boolean
 *                       note:
 *                         type: string
 *                       yelpData:
 *                         type: object
 *       404:
 *         description: Collection not found
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
router.get('/:id', collectionController.getCollection);

/**
 * @openapi
 * /api/collections:
 *   post:
 *     tags: [Collections]
 *     summary: Add a new collection by ID and perform initial sync
 *     description: Add a new Yelp collection to the database and synchronize its businesses
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               collectionId:
 *                 type: string
 *                 description: Yelp collection ID to add
 *               generateEmbedding:
 *                 type: boolean
 *                 description: Whether to generate embeddings for businesses
 *                 default: false
 *               updateYelpData:
 *                 type: boolean
 *                 description: Whether to update Yelp data for businesses
 *                 default: true
 *             required:
 *               - collectionId
 *     responses:
 *       201:
 *         description: Collection added and synced successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 collection:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     yelpCollectionId:
 *                       type: string
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     lastUpdated:
 *                       type: string
 *                       format: date-time
 *                 businessesProcessed:
 *                   type: integer
 *                 businessesUpdated:
 *                   type: integer
 *                 updatedBusinesses:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Invalid collection ID or scraping failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       409:
 *         description: Collection already exists
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
router.post('/', collectionController.addCollection);

export const collectionRoutes = router;
