import { Router } from 'express';
import { query, param } from 'express-validator';
import {
  getProperties,
  getPropertyById,
  getPropertiesByOwner,
  createProperty,
  updateProperty,
  deleteProperty,
  upload,
} from '../controllers/property.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validateQuery, validateParams } from '../middleware/validation.middleware';
import { cacheMiddleware } from '../middleware/cache.middleware';

const router = Router();

/**
 * GET /api/properties
 * Get properties with filters (public)
 */
router.get(
  '/',
  validateQuery([
    query('page').optional().isInt({ min: 1 }).withMessage('Page doit être un entier positif'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit doit être entre 1 et 100'),
    query('type').optional().isIn(['apartment', 'villa']).withMessage('Type invalide'),
    query('furnished').optional().isBoolean().withMessage('Furnished doit être un booléen'),
    query('priceMin').optional().isInt({ min: 0 }).withMessage('PriceMin doit être un entier positif'),
    query('priceMax').optional().isInt({ min: 0 }).withMessage('PriceMax doit être un entier positif'),
  ]),
  cacheMiddleware(300), // 5 minutes cache
  getProperties
);

/**
 * GET /api/properties/:id
 * Get property by ID (public)
 */
router.get(
  '/:id',
  validateParams([param('id').isUUID().withMessage('ID invalide')]),
  cacheMiddleware(600), // 10 minutes cache
  getPropertyById
);

/**
 * GET /api/properties/owner/:ownerId
 * Get properties by owner (protected)
 */
router.get(
  '/owner/:ownerId',
  authenticate,
  validateParams([param('ownerId').isUUID().withMessage('Owner ID invalide')]),
  getPropertiesByOwner
);

/**
 * POST /api/properties
 * Create property (protected - owner only)
 */
router.post(
  '/',
  authenticate,
  requireRole('owner', 'admin'),
  upload.array('images', 10), // Max 10 images
  createProperty
);

/**
 * PUT /api/properties/:id
 * Update property (protected - owner only)
 */
router.put(
  '/:id',
  authenticate,
  requireRole('owner', 'admin'),
  validateParams([param('id').isUUID().withMessage('ID invalide')]),
  updateProperty
);

/**
 * DELETE /api/properties/:id
 * Delete property (protected - owner only)
 */
router.delete(
  '/:id',
  authenticate,
  requireRole('owner', 'admin'),
  validateParams([param('id').isUUID().withMessage('ID invalide')]),
  deleteProperty
);

export default router;

