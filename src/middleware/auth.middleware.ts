import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { UnauthorizedException } from '../utils/errors';
import { sendError } from '../utils/responses';

/**
 * Extend Express Request to include user info
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
      requestId?: string;
    }
  }
}

/**
 * Authentication middleware
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token d\'authentification manquant');
    }

    const token = authHeader.substring(7);
    const payload = authService.verifyToken(token);

    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error: any) {
    if (error instanceof UnauthorizedException) {
      sendError(res, error.message, error.code, error.statusCode);
      return;
    }
    sendError(res, 'Erreur d\'authentification', 'AUTH_ERROR', 401);
  }
};

/**
 * Authorization middleware - require specific role
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Non authentifié', 'UNAUTHORIZED', 401);
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendError(res, 'Accès interdit - Rôle insuffisant', 'FORBIDDEN', 403);
      return;
    }

    next();
  };
};

/**
 * Optional authentication - sets user if token is valid, but doesn't fail if missing
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = authService.verifyToken(token);
      req.user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      };
    }
  } catch {
    // Ignore errors for optional auth
  }

  next();
};

