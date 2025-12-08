import { Request, Response, NextFunction } from 'express';
import { bookingService } from '../services/booking.service';
import { CreateBookingInput, UpdateBookingStatusInput } from '../models/Booking.model';
import { sendSuccess, sendError } from '../utils/responses';
import { NotFoundException, ValidationException, BusinessRuleException } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Get bookings
 */
export const getBookings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Non authentifié', 'UNAUTHORIZED', 401);
      return;
    }

    const bookings = await bookingService.getBookings(req.user.userId, req.user.role);
    sendSuccess(res, { bookings }, 'Réservations récupérées avec succès');
  } catch (error: any) {
    if (error instanceof BusinessRuleException) {
      sendError(res, error.message, error.code, error.statusCode);
      return;
    }
    logger.error('Get bookings controller error', { error: error.message });
    next(error);
  }
};

/**
 * Get booking by ID
 */
export const getBookingById = async (
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
    const booking = await bookingService.getBookingById(id, req.user.userId, req.user.role);
    sendSuccess(res, { booking }, 'Réservation récupérée avec succès');
  } catch (error: any) {
    if (error instanceof NotFoundException || error instanceof ValidationException) {
      sendError(res, error.message, error.code, error.statusCode);
      return;
    }
    logger.error('Get booking controller error', { error: error.message });
    next(error);
  }
};

/**
 * Create booking
 */
export const createBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Non authentifié', 'UNAUTHORIZED', 401);
      return;
    }

    if (req.user.role !== 'client') {
      sendError(res, 'Seuls les clients peuvent créer des réservations', 'FORBIDDEN', 403);
      return;
    }

    const input: CreateBookingInput = {
      property_id: req.body.property_id,
      start_date: req.body.start_date,
      end_date: req.body.end_date,
      guests: parseInt(req.body.guests, 10),
      message: req.body.message,
    };

    const booking = await bookingService.createBooking(input, req.user.userId);
    sendSuccess(res, { booking }, 'Réservation créée avec succès', 201);
  } catch (error: any) {
    if (
      error instanceof ValidationException ||
      error instanceof BusinessRuleException
    ) {
      sendError(res, error.message, error.code, error.statusCode);
      return;
    }
    logger.error('Create booking controller error', { error: error.message });
    next(error);
  }
};

/**
 * Update booking status
 */
export const updateBookingStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Non authentifié', 'UNAUTHORIZED', 401);
      return;
    }

    if (req.user.role !== 'owner' && req.user.role !== 'admin') {
      sendError(res, 'Seuls les propriétaires peuvent modifier le statut des réservations', 'FORBIDDEN', 403);
      return;
    }

    const { id } = req.params;
    const input: UpdateBookingStatusInput = {
      status: req.body.status,
    };

    const booking = await bookingService.updateBookingStatus(id, input, req.user.userId);
    sendSuccess(res, { booking }, 'Statut de la réservation mis à jour avec succès');
  } catch (error: any) {
    if (
      error instanceof NotFoundException ||
      error instanceof ValidationException
    ) {
      sendError(res, error.message, error.code, error.statusCode);
      return;
    }
    logger.error('Update booking status controller error', { error: error.message });
    next(error);
  }
};

/**
 * Cancel booking
 */
export const cancelBooking = async (
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
    await bookingService.cancelBooking(id, req.user.userId, req.user.role);
    sendSuccess(res, null, 'Réservation annulée avec succès');
  } catch (error: any) {
    if (
      error instanceof NotFoundException ||
      error instanceof ValidationException ||
      error instanceof BusinessRuleException
    ) {
      sendError(res, error.message, error.code, error.statusCode);
      return;
    }
    logger.error('Cancel booking controller error', { error: error.message });
    next(error);
  }
};

