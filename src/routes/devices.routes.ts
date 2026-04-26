import { Router } from 'express';
import { body } from 'express-validator';
import { registerDeviceToken, removeDeviceToken } from '../controllers/devices.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';

const router = Router();

/**
 * @swagger
 * /api/devices/token:
 *   post:
 *     summary: Enregistrer un token FCM
 *     description: Enregistre ou met à jour le token FCM de l'appareil pour les notifications push
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - platform
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token FCM de l'appareil
 *               platform:
 *                 type: string
 *                 enum: [ios, android]
 *                 description: Plateforme de l'appareil
 *     responses:
 *       200:
 *         description: Token enregistré avec succès
 *       401:
 *         description: Non authentifié
 */
router.post(
  '/token',
  authenticate,
  validateBody([
    body('token').notEmpty().withMessage('Token FCM requis'),
    body('platform').isIn(['ios', 'android']).withMessage('Plateforme invalide (ios ou android)'),
  ]),
  registerDeviceToken
);

/**
 * @swagger
 * /api/devices/token:
 *   delete:
 *     summary: Supprimer un token FCM
 *     description: Désactive le token FCM de l'appareil (lors de la déconnexion)
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token FCM à désactiver
 *     responses:
 *       200:
 *         description: Token supprimé avec succès
 *       401:
 *         description: Non authentifié
 */
router.delete(
  '/token',
  authenticate,
  validateBody([body('token').notEmpty().withMessage('Token FCM requis')]),
  removeDeviceToken
);

export default router;
