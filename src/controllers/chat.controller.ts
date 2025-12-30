import { Request, Response, NextFunction } from 'express';
import { chatService } from '../services/chat.service';
import { fileService } from '../services/file.service';
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
 * Get messages for a conversation (legacy route: /api/conversations/:id/messages)
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
 * Get messages for a conversation (new route: /api/messages?conversation_id=...)
 */
export const getMessagesByConversationId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    logger.info('getMessagesByConversationId called', { 
      method: req.method,
      url: req.originalUrl,
      query: req.query 
    });

    if (!req.user) {
      sendError(res, 'Non authentifié', 'UNAUTHORIZED', 401);
      return;
    }

    const conversationId = req.query.conversation_id as string;
    if (!conversationId) {
      logger.warn('conversation_id missing in query', { query: req.query });
      sendError(res, 'conversation_id est requis', 'VALIDATION_ERROR', 400);
      return;
    }

    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 100);

    logger.debug('Fetching messages', { conversationId, page, limit, userId: req.user.userId });

    const result = await chatService.getMessages(
      conversationId,
      req.user.userId,
      req.user.role,
      page,
      limit
    );

    logger.info('Messages fetched successfully', { 
      conversationId, 
      messageCount: result.messages.length 
    });

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
    logger.error('Get messages by conversation_id controller error', { 
      error: error.message,
      stack: error.stack,
      conversationId: req.query.conversation_id
    });
    next(error);
  }
};

/**
 * Send a message (legacy route: /api/conversations/:id/messages)
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
      message_type: req.body.message_type,
      file_url: req.body.file_url,
      file_name: req.body.file_name,
      file_size: req.body.file_size ? parseInt(req.body.file_size, 10) : undefined,
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
 * Send a message (new route: /api/messages with conversation_id in body)
 */
export const sendMessageByConversationId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Non authentifié', 'UNAUTHORIZED', 401);
      return;
    }

    const conversationId = req.body.conversation_id as string;
    if (!conversationId) {
      sendError(res, 'conversation_id est requis', 'VALIDATION_ERROR', 400);
      return;
    }

    const input: CreateMessageInput = {
      content: req.body.content,
      message_type: req.body.message_type,
      file_url: req.body.file_url,
      file_name: req.body.file_name,
      file_size: req.body.file_size ? parseInt(req.body.file_size, 10) : undefined,
    };

    const message = await chatService.sendMessage(
      conversationId,
      input,
      req.user.userId,
      req.user.role
    );

    // Invalidate conversations cache for both participants
    const conversation = await chatService.getConversationById(
      conversationId,
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
    logger.error('Send message by conversation_id controller error', { error: error.message });
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

/**
 * Upload file for a message
 */
export const uploadMessageFile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Non authentifié', 'UNAUTHORIZED', 401);
      return;
    }

    if (!req.file) {
      sendError(res, 'Aucun fichier fourni', 'VALIDATION_ERROR', 400);
      return;
    }

    const { id: conversationId } = req.params;
    if (!conversationId) {
      sendError(res, 'ID de conversation requis', 'VALIDATION_ERROR', 400);
      return;
    }

    // Verify user has access to this conversation
    await chatService.getConversationById(
      conversationId,
      req.user.userId,
      req.user.role
    );

    // Generate a temporary message ID for file path
    const tempMessageId = `temp-${Date.now()}`;

    // Upload file
    const fileUrl = await fileService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      conversationId,
      tempMessageId
    );

    sendSuccess(
      res,
      {
        file_url: fileUrl,
        file_name: req.file.originalname,
        file_size: req.file.size,
      },
      'Fichier téléchargé avec succès'
    );
  } catch (error: any) {
    if (
      error instanceof NotFoundException ||
      error instanceof ValidationException ||
      error instanceof BusinessRuleException
    ) {
      sendError(res, error.message, error.code, error.statusCode);
      return;
    }
    logger.error('Upload message file controller error', { error: error.message });
    next(error);
  }
};

