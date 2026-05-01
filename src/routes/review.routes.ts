import { Router } from 'express';
import { param, body } from 'express-validator';
import { getPropertyReviews, createReview, deleteReview } from '../controllers/review.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validateParams, validateBody } from '../middleware/validation.middleware';

const router = Router();

// GET /api/reviews/property/:propertyId — public: get reviews for a property
router.get(
  '/property/:propertyId',
  validateParams([param('propertyId').isUUID().withMessage('ID de propriété invalide')]),
  getPropertyReviews
);

// POST /api/reviews/property/:propertyId — authenticated client: create a review
router.post(
  '/property/:propertyId',
  authenticate,
  requireRole('client'),
  validateParams([param('propertyId').isUUID().withMessage('ID de propriété invalide')]),
  validateBody([
    body('rating').isFloat({ min: 1, max: 5 }).withMessage('La note doit être entre 1 et 5'),
    body('comment').trim().notEmpty().withMessage('Le commentaire est requis'),
  ]),
  createReview
);

// DELETE /api/reviews/:reviewId — authenticated: delete own review (or admin)
router.delete(
  '/:reviewId',
  authenticate,
  validateParams([param('reviewId').isUUID().withMessage('ID d\'avis invalide')]),
  deleteReview
);

export default router;
