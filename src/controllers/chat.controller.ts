import { Request, Response, NextFunction } from 'express';
import { chatService } from '../services/chat.service';
import { CreateConversationInput, CreateMessageInput } from '../models/Chat.model';
import { sendSuccess, sendPaginatedSuccess, sendError } from '../utils/responses';
import { NotFoundException, ValidationException, BusinessRuleException } from '../utils/errors';
import { logger } from '../utils/logger';
import { cacheService } from '../utils/cache';

/**
 * Get conversations
 */
export const getConversations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Non authentifié', 'UNAUTHORIZED', 401);
      return;
    }

    const role = (req.query.role as string) || req.user.role;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);
    const offset = (page - 1) * limit;

    // Cache key based on user ID, role, page, and limit
    const cacheKey = `cache:conversations:${req.user.userId}:${role}:${page}:${limit}`;
    const cached = await cacheService.get<any>(cacheKey);

    if (cached) {
      res.setHeader('X-Cache-Status', 'HIT');
      sendSuccess(res, { conversations: cached }, 'Conversations récupérées avec succès');
      return;
    }

    const conversations = await chatService.getConversations(
      req.user.userId,
      role,
      limit,
      offset
    );

    // Cache for 2 minutes
    await cacheService.set(cacheKey, conversations, 120);
    res.setHeader('X-Cache-Status', 'MISS');

    sendSuccess(res, { conversations }, 'Conversations récupérées avec succès');
  } catch (error: any) {
    if (error instanceof BusinessRuleException) {
      sendError(res, error.message, error.code, error.statusCode);
      return;
    }
    logger.error('Get conversations controller error', { error: error.message });
    next(error);
  }
};

/**
 * Get conversation by ID
 */
export const getConversationById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Non authentifié', 'UNAUTHORIZED', 401);
      return;
    }

    const { id } = req.params;
    const conversation = await chatService.getConversationById(
      id,
      req.user.userId,
      req.user.role
    );

    sendSuccess(res, { conversation }, 'Conversation récupérée avec succès');
  } catch (error: any) {
    if (error instanceof NotFoundException || error instanceof ValidationException) {
      sendError(res, error.message, error.code, error.statusCode);
      return;
    }
    logger.error('Get conversation controller error', { error: error.message });
    next(error);
  }
};

/**
 * Create conversation
 */
export const createConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Non authentifié', 'UNAUTHORIZED', 401);
      return;
    }

    const input: CreateConversationInput = {
      booking_id: req.body.booking_id,
    };

    const conversation = await chatService.createConversation(
      input,
      req.user.userId,
      req.user.role
    );

    // Invalidate conversations cache for this user
    await cacheService.deletePattern(`cache:conversations:${req.user.userId}:*`);

    sendSuccess(res, { conversation }, 'Conversation créée avec succès', 201);
  } catch (error: any) {
    if (
      error instanceof ValidationException ||
      error instanceof BusinessRuleException ||
      error instanceof NotFoundException
    ) {
      sendError(res, error.message, error.code, error.statusCode);
      return;
    }
    logger.error('Create conversation controller error', { error: error.message });
    next(error);
  }
};

/**
 * Get messages for a conversation
 */
export const getMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Non authentifié', 'UNAUTHORIZED', 401);
      return;
    }

    const { id } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 100);

    const result = await chatService.getMessages(
      id,
      req.user.userId,
      req.user.role,
      page,
      limit
    );

    sendPaginatedSuccess(
      res,
      result.messages,
      result.pagination,
      'Messages récupérés avec succès'
    );
  } catch (error: any) {
    if (error instanceof NotFoundException || error instanceof ValidationException) {
      sendError(res, error.message, error.code, error.statusCode);
      return;
    }
    logger.error('Get messages controller error', { error: error.message });
    next(error);
  }
};

/**
 * Send a message
 */
export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Non authentifié', 'UNAUTHORIZED', 401);
      return;
    }

    const { id } = req.params;
    const input: CreateMessageInput = {
      content: req.body.content,
    };

    const message = await chatService.sendMessage(
      id,
      input,
      req.user.userId,
      req.user.role
    );

    // Invalidate conversations cache for both participants
    const conversation = await chatService.getConversationById(
      id,
      req.user.userId,
      req.user.role
    );
    await cacheService.deletePattern(`cache:conversations:${conversation.client_id}:*`);
    await cacheService.deletePattern(`cache:conversations:${conversation.owner_id}:*`);

    sendSuccess(res, { message }, 'Message envoyé avec succès', 201);
  } catch (error: any) {
    if (
      error instanceof NotFoundException ||
      error instanceof ValidationException ||
      error instanceof BusinessRuleException
    ) {
      sendError(res, error.message, error.code, error.statusCode);
      return;
    }
    logger.error('Send message controller error', { error: error.message });
    next(error);
  }
};

/**
 * Mark message as read
 */
export const markMessageAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Non authentifié', 'UNAUTHORIZED', 401);
      return;
    }

    const { id } = req.params;
    await chatService.markMessageAsRead(id, req.user.userId, req.user.role);

    sendSuccess(res, null, 'Message marqué comme lu');
  } catch (error: any) {
    if (error instanceof NotFoundException || error instanceof ValidationException) {
      sendError(res, error.message, error.code, error.statusCode);
      return;
    }
    logger.error('Mark message as read controller error', { error: error.message });
    next(error);
  }
};

/**
 * Get unread count for a conversation
 */
export const getUnreadCount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Non authentifié', 'UNAUTHORIZED', 401);
      return;
    }

    const { id } = req.params;
    
    // Verify user has access to this conversation
    await chatService.getConversationById(id, req.user.userId, req.user.role);

    const count = await chatService.getUnreadCount(id, req.user.userId);

    sendSuccess(res, { unread_count: count }, 'Nombre de messages non lus récupéré');
  } catch (error: any) {
    if (error instanceof NotFoundException || error instanceof ValidationException) {
      sendError(res, error.message, error.code, error.statusCode);
      return;
    }
    logger.error('Get unread count controller error', { error: error.message });
    next(error);
  }
};

