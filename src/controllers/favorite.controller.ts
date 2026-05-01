import { Request, Response, NextFunction } from 'express';
import { favoriteService } from '../services/favorite.service';
import { sendSuccess, sendError } from '../utils/responses';
import { BusinessRuleException } from '../utils/errors';
import { logger } from '../utils/logger';

export const getFavorites = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const propertyIds = await favoriteService.getFavorites(req.user!.userId);
    sendSuccess(res, { propertyIds }, 'Favoris récupérés avec succès');
  } catch (error: any) {
    if (error instanceof BusinessRuleException) {
      sendError(res, error.message, error.code, error.statusCode);
      return;
    }
    logger.error('Get favorites controller error', { error: error.message });
    next(error);
  }
};

export const addFavorite = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await favoriteService.addFavorite(req.user!.userId, req.params.propertyId);
    sendSuccess(res, null, 'Ajouté aux favoris');
  } catch (error: any) {
    if (error instanceof BusinessRuleException) {
      sendError(res, error.message, error.code, error.statusCode);
      return;
    }
    logger.error('Add favorite controller error', { error: error.message });
    next(error);
  }
};

export const removeFavorite = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await favoriteService.removeFavorite(req.user!.userId, req.params.propertyId);
    sendSuccess(res, null, 'Retiré des favoris');
  } catch (error: any) {
    if (error instanceof BusinessRuleException) {
      sendError(res, error.message, error.code, error.statusCode);
      return;
    }
    logger.error('Remove favorite controller error', { error: error.message });
    next(error);
  }
};
