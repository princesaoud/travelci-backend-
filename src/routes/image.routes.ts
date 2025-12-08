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
 * POST /api/images/upload
 * Upload and optimize image (protected)
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
 * GET /api/images/optimize
 * Get optimized image URL (public)
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

