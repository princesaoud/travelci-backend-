import { Router } from 'express';
import { query } from 'express-validator';
import { imageService } from '../services/image.service';
import { upload } from '../controllers/property.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateQuery } from '../middleware/validation.middleware';
import { sendSuccess, sendError } from '../utils/responses';
import { logger } from '../utils/logger';
import { Request, Response, NextFunction } from 'express';

const router = Router();

/**
 * @swagger
 * /api/images/upload:
 *   post:
 *     summary: Télécharger et optimiser une image
 *     description: Télécharge une image et génère des versions optimisées (thumbnail, medium, large)
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Fichier image à télécharger
 *               propertyId:
 *                 type: string
 *                 format: uuid
 *                 description: ID de la propriété (optionnel)
 *     responses:
 *       200:
 *         description: Image téléchargée et optimisée avec succès
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
 *                         thumbnail:
 *                           type: string
 *                           format: uri
 *                         medium:
 *                           type: string
 *                           format: uri
 *                         large:
 *                           type: string
 *                           format: uri
 *       400:
 *         description: Aucun fichier fourni ou erreur de validation
 *       401:
 *         description: Non authentifié
 */
router.post('/upload', authenticate, upload.single('image'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      sendError(res, 'Aucun fichier image fourni', 'VALIDATION_ERROR', 400);
      return;
    }

    const propertyId = req.body.propertyId || 'temp';
    const result = await imageService.uploadAndOptimize(req.file.buffer, propertyId);

    sendSuccess(res, result, 'Image téléchargée et optimisée avec succès');
  } catch (error: any) {
    logger.error('Image upload error', { error: error.message });
    next(error);
  }
});

/**
 * @swagger
 * /api/images/optimize:
 *   get:
 *     summary: Obtenir une URL d'image optimisée
 *     description: Génère une URL d'image optimisée avec les paramètres spécifiés (public)
 *     tags: [Images]
 *     parameters:
 *       - in: query
 *         name: url
 *         required: true
 *         schema:
 *           type: string
 *           format: uri
 *         description: URL de l'image source
 *       - in: query
 *         name: width
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Largeur souhaitée en pixels
 *       - in: query
 *         name: height
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Hauteur souhaitée en pixels
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [webp, jpg, png, auto]
 *           default: auto
 *         description: Format d'image souhaité
 *     responses:
 *       200:
 *         description: URL optimisée générée avec succès
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
 *                         url:
 *                           type: string
 *                           format: uri
 *                           description: URL de l'image optimisée
 *       400:
 *         description: Erreur de validation
 */
router.get(
  '/optimize',
  validateQuery([
    query('url').notEmpty().withMessage('URL requise'),
    query('width').optional().isInt({ min: 1 }).withMessage('Width doit être un entier positif'),
    query('height').optional().isInt({ min: 1 }).withMessage('Height doit être un entier positif'),
    query('format').optional().isIn(['webp', 'jpg', 'png', 'auto']).withMessage('Format invalide'),
  ]),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { url, width, height, format } = req.query;
      const optimizedUrl = imageService.getOptimizedUrl(
        url as string,
        width ? parseInt(width as string, 10) : undefined,
        height ? parseInt(height as string, 10) : undefined,
        format as string
      );

      sendSuccess(res, { url: optimizedUrl }, 'URL optimisée générée avec succès');
    } catch (error: any) {
      logger.error('Image optimize error', { error: error.message });
      next(error);
    }
  }
);

export default router;

