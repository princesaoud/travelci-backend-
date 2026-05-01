import { Request, Response, NextFunction } from 'express';
import { reviewService } from '../services/review.service';
import { sendSuccess, sendError } from '../utils/responses';
import { NotFoundException, ValidationException, BusinessRuleException } from '../utils/errors';
import { logger } from '../utils/logger';

export const getPropertyReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const reviews = await reviewService.getReviews(req.params.propertyId);
    const { average, count } = await reviewService.getAverageRating(req.params.propertyId);
    sendSuccess(res, { reviews, average, count }, 'Avis récupérés avec succès');
  } catch (error: any) {
    if (error instanceof BusinessRuleException) {
      sendError(res, error.message, error.code, error.statusCode);
      return;
    }
    logger.error('Get reviews controller error', { error: error.message });
    next(error);
  }
};

export const createReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { rating, comment } = req.body;
    const review = await reviewService.createReview(
      req.params.propertyId,
      req.user!.userId,
      req.user!.email,
      { rating: parseFloat(rating), comment }
    );
    sendSuccess(res, { review }, 'Avis publié avec succès', 201);
  } catch (error: any) {
    if (error instanceof ValidationException || error instanceof BusinessRuleException) {
      sendError(res, error.message, error.code, error.statusCode);
      return;
    }
    logger.error('Create review controller error', { error: error.message });
    next(error);
  }
};

export const deleteReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await reviewService.deleteReview(
      req.params.reviewId,
      req.user!.userId,
      req.user!.role
    );
    sendSuccess(res, null, 'Avis supprimé avec succès');
  } catch (error: any) {
    if (error instanceof NotFoundException || error instanceof ValidationException || error instanceof BusinessRuleException) {
      sendError(res, error.message, error.code, error.statusCode);
      return;
    }
    logger.error('Delete review controller error', { error: error.message });
    next(error);
  }
};
