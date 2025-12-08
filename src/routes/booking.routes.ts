import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getBookings,
  getBookingById,
  createBooking,
  updateBookingStatus,
  cancelBooking,
} from '../controllers/booking.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware';

const router = Router();

/**
 * GET /api/bookings
 * Get bookings (protected)
 */
router.get(
  '/',
  authenticate,
  validateQuery([
    query('role').optional().isIn(['client', 'owner']).withMessage('Rôle invalide'),
  ]),
  getBookings
);

/**
 * GET /api/bookings/:id
 * Get booking by ID (protected)
 */
router.get(
  '/:id',
  authenticate,
  validateParams([param('id').isUUID().withMessage('ID invalide')]),
  getBookingById
);

/**
 * POST /api/bookings
 * Create booking (protected - client only)
 */
router.post(
  '/',
  authenticate,
  requireRole('client'),
  validateBody([
    body('property_id').isUUID().withMessage('Property ID invalide'),
    body('start_date').isISO8601().withMessage('Date de début invalide'),
    body('end_date').isISO8601().withMessage('Date de fin invalide'),
    body('guests').isInt({ min: 1 }).withMessage('Le nombre d\'invités doit être au moins 1'),
    body('message').optional().isString().withMessage('Message invalide'),
  ]),
  createBooking
);

/**
 * PUT /api/bookings/:id/status
 * Update booking status (protected - owner only)
 */
router.put(
  '/:id/status',
  authenticate,
  requireRole('owner', 'admin'),
  validateParams([param('id').isUUID().withMessage('ID invalide')]),
  validateBody([
    body('status').isIn(['accepted', 'declined']).withMessage('Statut invalide'),
  ]),
  updateBookingStatus
);

/**
 * PUT /api/bookings/:id/cancel
 * Cancel booking (protected)
 */
router.put(
  '/:id/cancel',
  authenticate,
  validateParams([param('id').isUUID().withMessage('ID invalide')]),
  cancelBooking
);

export default router;

