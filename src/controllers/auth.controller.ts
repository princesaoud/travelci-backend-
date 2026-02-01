import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { imageService } from '../services/image.service';
import { CreateUserInput } from '../models/User.model';
import { sendSuccess, sendError } from '../utils/responses';
import { NotFoundException, ValidationException, BusinessRuleException } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Register a new user (supports multipart for owner: national_id_front, national_id_back)
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const body = req.body as Record<string, string>;
    const input: CreateUserInput = {
      full_name: body.full_name,
      email: body.email,
      password: body.password,
      phone: body.phone || undefined,
      role: (body.role as 'client' | 'owner' | 'admin') || 'client',
    };

    const result = await authService.register(input);

    if (result.user.role === 'owner' && req.files && typeof req.files === 'object') {
      const files = req.files as { national_id_front?: Express.Multer.File[]; national_id_back?: Express.Multer.File[] };
      let urlFront: string | undefined;
      let urlBack: string | undefined;
      try {
        if (files.national_id_front?.[0]?.buffer) {
          urlFront = await imageService.uploadIdDocument(result.user.id, files.national_id_front[0].buffer, 'front');
        }
        if (files.national_id_back?.[0]?.buffer) {
          urlBack = await imageService.uploadIdDocument(result.user.id, files.national_id_back[0].buffer, 'back');
        }
        if (urlFront || urlBack) {
          await authService.updateUserProfile(result.user.id, {
            national_id_front_url: urlFront,
            national_id_back_url: urlBack,
          });
          const updatedUser = await authService.getUserById(result.user.id);
          result.user = updatedUser;
        }
      } catch (uploadErr: any) {
        logger.warn('ID document upload failed during register', { error: uploadErr.message, userId: result.user.id });
      }
    }

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
  _req: Request,
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

