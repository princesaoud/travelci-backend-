import { Router } from 'express';
import { query, param } from 'express-validator';
import {
  getProperties,
  getPropertyById,
  getPropertiesByOwner,
  createProperty,
  updateProperty,
  deleteProperty,
  getPropertyBookings,
  upload,
} from '../controllers/property.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validateQuery, validateParams } from '../middleware/validation.middleware';
import { cacheMiddleware } from '../middleware/cache.middleware';

const router = Router();

/**
 * @swagger
 * /api/properties:
 *   get:
 *     summary: Lister les propriétés avec filtres
 *     description: Récupère une liste paginée de propriétés avec possibilité de filtrer
 *     tags: [Properties]
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filtrer par ville
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [apartment, villa]
 *         description: Type de propriété
 *       - in: query
 *         name: furnished
 *         schema:
 *           type: boolean
 *         description: Meublé ou non
 *       - in: query
 *         name: priceMin
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Prix minimum par nuit
 *       - in: query
 *         name: priceMax
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Prix maximum par nuit
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Nombre d'éléments par page
 *     responses:
 *       200:
 *         description: Liste des propriétés
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
 *                         properties:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Property'
 *       400:
 *         description: Erreur de validation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
 * @swagger
 * /api/properties/{id}:
 *   get:
 *     summary: Obtenir une propriété par ID
 *     description: Récupère les détails d'une propriété spécifique
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la propriété
 *     responses:
 *       200:
 *         description: Détails de la propriété
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
 *                         property:
 *                           $ref: '#/components/schemas/Property'
 *       404:
 *         description: Propriété non trouvée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/:id',
  validateParams([param('id').isUUID().withMessage('ID invalide')]),
  cacheMiddleware(600), // 10 minutes cache
  getPropertyById
);

/**
 * @swagger
 * /api/properties/{id}/bookings:
 *   get:
 *     summary: Obtenir les réservations d'une propriété (pour vérifier la disponibilité)
 *     description: Récupère les réservations acceptées et en attente d'une propriété pour afficher les dates occupées
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la propriété
 *     responses:
 *       200:
 *         description: Liste des réservations de la propriété
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
 *       404:
 *         description: Propriété non trouvée
 */
router.get(
  '/:id/bookings',
  validateParams([param('id').isUUID().withMessage('ID invalide')]),
  cacheMiddleware(60), // 1 minute cache (availability changes frequently)
  getPropertyBookings
);

/**
 * @swagger
 * /api/properties/owner/{ownerId}:
 *   get:
 *     summary: Obtenir les propriétés d'un propriétaire
 *     description: Récupère toutes les propriétés d'un propriétaire spécifique (authentifié uniquement)
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ownerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID du propriétaire
 *     responses:
 *       200:
 *         description: Liste des propriétés du propriétaire
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
 *                         properties:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Property'
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Propriétaire non trouvé
 */
router.get(
  '/owner/:ownerId',
  authenticate,
  validateParams([param('ownerId').isUUID().withMessage('Owner ID invalide')]),
  getPropertiesByOwner
);

/**
 * @swagger
 * /api/properties:
 *   post:
 *     summary: Créer une nouvelle propriété
 *     description: Crée une nouvelle propriété (propriétaire ou admin uniquement)
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - type
 *               - price_per_night
 *               - address
 *               - city
 *             properties:
 *               title:
 *                 type: string
 *                 example: Appartement moderne au centre-ville
 *               description:
 *                 type: string
 *                 example: Magnifique appartement avec vue sur la ville
 *               type:
 *                 type: string
 *                 enum: [apartment, villa]
 *                 example: apartment
 *               furnished:
 *                 type: boolean
 *                 example: true
 *               price_per_night:
 *                 type: number
 *                 example: 150
 *               address:
 *                 type: string
 *                 example: 123 Rue de la Paix
 *               city:
 *                 type: string
 *                 example: Paris
 *               latitude:
 *                 type: number
 *                 example: 48.8566
 *               longitude:
 *                 type: number
 *                 example: 2.3522
 *               amenities:
 *                 type: string
 *                 description: JSON array string
 *                 example: '["wifi", "parking", "pool"]'
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Images de la propriété (max 10)
 *     responses:
 *       201:
 *         description: Propriété créée avec succès
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
 *                         property:
 *                           $ref: '#/components/schemas/Property'
 *       400:
 *         description: Erreur de validation
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Permissions insuffisantes
 */
router.post(
  '/',
  authenticate,
  requireRole('owner', 'admin'),
  upload.array('images', 10), // Max 10 images
  createProperty
);

/**
 * @swagger
 * /api/properties/{id}:
 *   put:
 *     summary: Mettre à jour une propriété
 *     description: Met à jour une propriété existante (propriétaire ou admin uniquement)
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la propriété
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [apartment, villa]
 *               furnished:
 *                 type: boolean
 *               price_per_night:
 *                 type: number
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Propriété mise à jour avec succès
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
 *                         property:
 *                           $ref: '#/components/schemas/Property'
 *       400:
 *         description: Erreur de validation
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Permissions insuffisantes
 *       404:
 *         description: Propriété non trouvée
 */
router.put(
  '/:id',
  authenticate,
  requireRole('owner', 'admin'),
  validateParams([param('id').isUUID().withMessage('ID invalide')]),
  updateProperty
);

/**
 * @swagger
 * /api/properties/{id}:
 *   delete:
 *     summary: Supprimer une propriété
 *     description: Supprime une propriété (propriétaire ou admin uniquement)
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la propriété
 *     responses:
 *       200:
 *         description: Propriété supprimée avec succès
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
 *                           example: Propriété supprimée avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Permissions insuffisantes
 *       404:
 *         description: Propriété non trouvée
 */
router.delete(
  '/:id',
  authenticate,
  requireRole('owner', 'admin'),
  validateParams([param('id').isUUID().withMessage('ID invalide')]),
  deleteProperty
);

export default router;

