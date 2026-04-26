import { Request, Response, NextFunction } from 'express';
import { fcmService } from '../services/fcm.service';
import { sendSuccess, sendError } from '../utils/responses';
import { logger } from '../utils/logger';

/**
 * Register a FCM device token for the authenticated user.
 * Called by the Flutter app after Firebase.initializeApp() resolves a token.
 */
export const registerDeviceToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Non authentifié', 'UNAUTHORIZED', 401);
      return;
    }

    const { token, platform } = req.body as { token: string; platform: 'ios' | 'android' };

    await fcmService.registerToken(req.user.userId, token, platform);
    sendSuccess(res, null, 'Token enregistré avec succès');
  } catch (err: any) {
    logger.error('Register device token error', { error: err.message });
    next(err);
  }
};

/**
 * Remove a specific FCM device token (e.g. on logout from one device).
 */
export const removeDeviceToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Non authentifié', 'UNAUTHORIZED', 401);
      return;
    }

    const { token } = req.body as { token: string };

    await fcmService.removeToken(req.user.userId, token);
    sendSuccess(res, null, 'Token supprimé avec succès');
  } catch (err: any) {
    logger.error('Remove device token error', { error: err.message });
    next(err);
  }
};
