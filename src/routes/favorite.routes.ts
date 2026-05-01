import { Router } from 'express';
import { param } from 'express-validator';
import { getFavorites, addFavorite, removeFavorite } from '../controllers/favorite.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateParams } from '../middleware/validation.middleware';

const router = Router();

// GET /api/favorites — get current user's favorite property IDs
router.get('/', authenticate, getFavorites);

// POST /api/favorites/:propertyId — add to favorites
router.post(
  '/:propertyId',
  authenticate,
  validateParams([param('propertyId').isUUID().withMessage('ID de propriété invalide')]),
  addFavorite
);

// DELETE /api/favorites/:propertyId — remove from favorites
router.delete(
  '/:propertyId',
  authenticate,
  validateParams([param('propertyId').isUUID().withMessage('ID de propriété invalide')]),
  removeFavorite
);

export default router;
