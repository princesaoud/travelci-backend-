import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { CreateUserInput } from '../models/User.model';
import { sendSuccess, sendError } from '../utils/responses';
import { NotFoundException, ValidationException, BusinessRuleException } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Register a new user
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const input: CreateUserInput = req.body;
    const result = await authService.register(input);
    sendSuccess(res, result, 'Utilisateur enregistré avec succès', 201);
  } catch (error: any) {
    if (error instanceof ValidationException || error instanceof BusinessRuleException) {
      sendError(res, error.message, error.code, error.statusCode);
      return;
    }
    logger.error('Register controller error', { error: error.message });
    next(error);
  }
};

/**
 * Login user
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      sendError(res, 'Email et mot de passe requis', 'VALIDATION_ERROR', 400);
      return;
    }

    const result = await authService.login(email, password);
    sendSuccess(res, result, 'Connexion réussie');
  } catch (error: any) {
    if (
      error instanceof NotFoundException ||
      error instanceof ValidationException
    ) {
      sendError(res, error.message, error.code, error.statusCode);
      return;
    }
    logger.error('Login controller error', { error: error.message });
    next(error);
  }
};

/**
 * Get current user
 */
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Non authentifié', 'UNAUTHORIZED', 401);
      return;
    }

    const user = await authService.getUserById(req.user.userId);
    sendSuccess(res, { user }, 'Utilisateur récupéré avec succès');
  } catch (error: any) {
    if (error instanceof NotFoundException) {
      sendError(res, error.message, error.code, error.statusCode);
      return;
    }
    logger.error('Get me controller error', { error: error.message });
    next(error);
  }
};

/**
 * Logout user
 */
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // But we can invalidate tokens if using a token blacklist
    sendSuccess(res, null, 'Déconnexion réussie');
  } catch (error: any) {
    logger.error('Logout controller error', { error: error.message });
    next(error);
  }
};

