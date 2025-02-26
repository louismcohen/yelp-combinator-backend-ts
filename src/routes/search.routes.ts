import { Router } from 'express';
import { searchController } from '../controllers/search.controller';

const router = Router();

/**
 * @openapi
 * /api/search:
 *   post:
 *     tags: [Search]
 *     summary: Search businesses using natural language
 *     description: Comprehensive search across businesses with geographic filtering
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
 *                 description: Natural language search query
 *               viewport:
 *                 type: object
 *                 description: Map viewport boundaries
 *                 properties:
 *                   northeast:
 *                     type: object
 *                     properties:
 *                       lat:
 *                         type: number
 *                       lng:
 *                         type: number
 *                   southwest:
 *                     type: object
 *                     properties:
 *                       lat:
 *                         type: number
 *                       lng:
 *                         type: number
 *               userLocation:
 *                 type: object
 *                 description: User's current location
 *                 properties:
 *                   lat:
 *                     type: number
 *                   lng:
 *                     type: number
 *               config:
 *                 type: object
 *                 description: Search configuration options
 *                 properties:
 *                   limit:
 *                     type: integer
 *                     description: Maximum number of results
 *                     default: 20
 *                   includeVisited:
 *                     type: boolean
 *                     description: Whether to include visited businesses
 *                     default: true
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
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
 *                       yelpData:
 *                         type: object
 *                       score:
 *                         type: number
 *                       distance:
 *                         type: number
 *                         description: Distance in meters from user location (if provided)
 *                 query:
 *                   type: string
 *                   description: The processed query
 *                 searchType:
 *                   type: string
 *                   description: The type of search performed
 *                   enum: [semantic, text, category]
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
router.post('/', searchController.search);

export const searchRoutes = router;
