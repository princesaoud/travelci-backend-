import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getConversations,
  getConversationById,
  createConversation,
  getMessages,
  sendMessage,
  markMessageAsRead,
  getUnreadCount,
} from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware';

const router = Router();

/**
 * @swagger
 * /api/conversations:
 *   get:
 *     summary: Obtenir les conversations
 *     description: Récupère les conversations de l'utilisateur authentifié (filtrées par rôle: client ou owner)
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [client, owner]
 *         description: Filtrer par rôle (conversations en tant que client ou propriétaire)
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
 *         description: Nombre de résultats par page
 *     responses:
 *       200:
 *         description: Liste des conversations
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
 *                         conversations:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Conversation'
 *       401:
 *         description: Non authentifié
 */
router.get(
  '/',
  authenticate,
  validateQuery([
    query('role').optional().isIn(['client', 'owner']).withMessage('Rôle invalide'),
    query('page').optional().isInt({ min: 1 }).withMessage('Numéro de page invalide'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite invalide (1-100)'),
  ]),
  getConversations
);

/**
 * @swagger
 * /api/conversations/{id}:
 *   get:
 *     summary: Obtenir une conversation par ID
 *     description: Récupère les détails d'une conversation spécifique avec les participants
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la conversation
 *     responses:
 *       200:
 *         description: Détails de la conversation
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
 *                         conversation:
 *                           $ref: '#/components/schemas/Conversation'
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Conversation non trouvée
 */
router.get(
  '/:id',
  authenticate,
  validateParams([param('id').isUUID().withMessage('ID invalide')]),
  getConversationById
);

/**
 * @swagger
 * /api/conversations:
 *   post:
 *     summary: Créer une conversation
 *     description: Crée une nouvelle conversation pour une réservation (auto-créée si la réservation existe)
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - booking_id
 *             properties:
 *               booking_id:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       201:
 *         description: Conversation créée avec succès
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
 *                         conversation:
 *                           $ref: '#/components/schemas/Conversation'
 *       400:
 *         description: Erreur de validation
 *       401:
 *         description: Non authentifié
 */
router.post(
  '/',
  authenticate,
  validateBody([
    body('booking_id').isUUID().withMessage('Booking ID invalide'),
  ]),
  createConversation
);

/**
 * @swagger
 * /api/conversations/{id}/messages:
 *   get:
 *     summary: Obtenir les messages d'une conversation
 *     description: Récupère les messages d'une conversation avec pagination
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la conversation
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
 *           default: 50
 *         description: Nombre de messages par page
 *     responses:
 *       200:
 *         description: Liste des messages
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Message'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Conversation non trouvée
 */
router.get(
  '/:id/messages',
  authenticate,
  validateParams([param('id').isUUID().withMessage('ID invalide')]),
  validateQuery([
    query('page').optional().isInt({ min: 1 }).withMessage('Numéro de page invalide'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite invalide (1-100)'),
  ]),
  getMessages
);

/**
 * @swagger
 * /api/conversations/{id}/messages:
 *   post:
 *     summary: Envoyer un message
 *     description: Envoie un nouveau message dans une conversation
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la conversation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 5000
 *                 example: Bonjour, je suis intéressé par votre propriété.
 *     responses:
 *       201:
 *         description: Message envoyé avec succès
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
 *                           $ref: '#/components/schemas/Message'
 *       400:
 *         description: Erreur de validation
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Conversation non trouvée
 */
router.post(
  '/:id/messages',
  authenticate,
  validateParams([param('id').isUUID().withMessage('ID invalide')]),
  validateBody([
    body('content')
      .trim()
      .notEmpty()
      .withMessage('Le contenu du message est requis')
      .isLength({ max: 5000 })
      .withMessage('Le message ne peut pas dépasser 5000 caractères'),
  ]),
  sendMessage
);

/**
 * @swagger
 * /api/conversations/{id}/unread-count:
 *   get:
 *     summary: Obtenir le nombre de messages non lus
 *     description: Récupère le nombre de messages non lus pour une conversation
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la conversation
 *     responses:
 *       200:
 *         description: Nombre de messages non lus
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
 *                         unread_count:
 *                           type: integer
 *                           example: 5
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Conversation non trouvée
 */
router.get(
  '/:id/unread-count',
  authenticate,
  validateParams([param('id').isUUID().withMessage('ID invalide')]),
  getUnreadCount
);

export default router;

// Separate router for messages endpoints (mounted at /api/messages)
export const messageRouter = Router();

/**
 * @swagger
 * /api/messages/{id}/read:
 *   put:
 *     summary: Marquer un message comme lu
 *     description: Marque un message spécifique comme lu
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID du message
 *     responses:
 *       200:
 *         description: Message marqué comme lu
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
 *                           example: Message marqué comme lu
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Message non trouvé
 */
messageRouter.put(
  '/:id/read',
  authenticate,
  validateParams([param('id').isUUID().withMessage('ID invalide')]),
  markMessageAsRead
);

