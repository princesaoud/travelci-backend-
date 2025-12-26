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
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Obtenir les réservations
 *     description: Récupère les réservations de l'utilisateur authentifié (clients ou propriétaires)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [client, owner]
 *         description: Filtrer par rôle (réservations en tant que client ou propriétaire)
 *     responses:
 *       200:
 *         description: Liste des réservations
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         bookings:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Non authentifié
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
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Obtenir une réservation par ID
 *     description: Récupère les détails d'une réservation spécifique
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la réservation
 *     responses:
 *       200:
 *         description: Détails de la réservation
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         booking:
 *                           $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Réservation non trouvée
 */
router.get(
  '/:id',
  authenticate,
  validateParams([param('id').isUUID().withMessage('ID invalide')]),
  getBookingById
);

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Créer une réservation
 *     description: Crée une nouvelle réservation (clients uniquement)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - property_id
 *               - start_date
 *               - end_date
 *               - guests
 *             properties:
 *               property_id:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               start_date:
 *                 type: string
 *                 format: date
 *                 example: 2024-06-01
 *               end_date:
 *                 type: string
 *                 format: date
 *                 example: 2024-06-07
 *               guests:
 *                 type: integer
 *                 minimum: 1
 *                 example: 2
 *               message:
 *                 type: string
 *                 example: Message optionnel pour le propriétaire
 *     responses:
 *       201:
 *         description: Réservation créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         booking:
 *                           $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Erreur de validation
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Seuls les clients peuvent créer des réservations
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
 * @swagger
 * /api/bookings/{id}/status:
 *   put:
 *     summary: Mettre à jour le statut d'une réservation
 *     description: Met à jour le statut d'une réservation (propriétaires ou admins uniquement)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la réservation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [accepted, declined]
 *                 example: accepted
 *     responses:
 *       200:
 *         description: Statut mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         booking:
 *                           $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Erreur de validation
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Permissions insuffisantes
 *       404:
 *         description: Réservation non trouvée
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
 * @swagger
 * /api/bookings/{id}/cancel:
 *   put:
 *     summary: Annuler une réservation
 *     description: Annule une réservation (client ou propriétaire)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la réservation
 *     responses:
 *       200:
 *         description: Réservation annulée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         message:
 *                           type: string
 *                           example: Réservation annulée avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Vous ne pouvez pas annuler cette réservation
 *       404:
 *         description: Réservation non trouvée
 */
router.put(
  '/:id/cancel',
  authenticate,
  validateParams([param('id').isUUID().withMessage('ID invalide')]),
  cancelBooking
);

export default router;

