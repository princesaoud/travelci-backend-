import { Request, Response, NextFunction } from 'express';
import { propertyService } from '../services/property.service';
import { bookingService } from '../services/booking.service';
import { availabilityService } from '../services/availability.service';
import { imageService } from '../services/image.service';
import { CreatePropertyInput, UpdatePropertyInput, PropertyFilters } from '../models/Property.model';
import { sendSuccess, sendPaginatedSuccess, sendError, calculatePagination } from '../utils/responses';
import { NotFoundException, ValidationException, BusinessRuleException } from '../utils/errors';
import { logger } from '../utils/logger';
import multer from 'multer';

/**
 * Configure multer for memory storage
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers image sont autorisés'));
    }
  },
});

export { upload };

/**
 * Get properties with filters
 */
export const getProperties = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filters: PropertyFilters = {
      city: req.query.city as string,
      type: req.query.type as 'apartment' | 'villa',
      furnished: req.query.furnished === 'true' ? true : req.query.furnished === 'false' ? false : undefined,
      priceMin: req.query.priceMin ? parseInt(req.query.priceMin as string, 10) : undefined,
      priceMax: req.query.priceMax ? parseInt(req.query.priceMax as string, 10) : undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
    };

    const { properties, total } = await propertyService.getProperties(filters);
    const pagination = calculatePagination(filters.page || 1, filters.limit || 20, total);

    sendPaginatedSuccess(res, properties, pagination, 'Propriétés récupérées avec succès');
  } catch (error: any) {
    if (error instanceof BusinessRuleException) {
      sendError(res, error.message, error.code, error.statusCode);
      return;
    }
    logger.error('Get properties controller error', { error: error.message });
    next(error);
  }
};

/**
 * Get property by ID
 */
export const getPropertyById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const property = await propertyService.getPropertyById(id);
    sendSuccess(res, { property }, 'Propriété récupérée avec succès');
  } catch (error: any) {
    if (error instanceof NotFoundException) {
      sendError(res, error.message, error.code, error.statusCode);
      return;
    }
    logger.error('Get property controller error', { error: error.message, id: req.params.id });
    next(error);
  }
};

/**
 * Get properties by owner
 */
export const getPropertiesByOwner = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { ownerId } = req.params;
    const properties = await propertyService.getPropertiesByOwner(ownerId);
    sendSuccess(res, { properties }, 'Propriétés récupérées avec succès');
  } catch (error: any) {
    if (error instanceof BusinessRuleException) {
      sendError(res, error.message, error.code, error.statusCode);
      return;
    }
    logger.error('Get properties by owner controller error', { error: error.message });
    next(error);
  }
};

/**
 * Create property
 */
export const createProperty = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Non authentifié', 'UNAUTHORIZED', 401);
      return;
    }

    const input: CreatePropertyInput = {
      title: req.body.title,
      description: req.body.description,
      type: req.body.type,
      furnished: req.body.furnished === 'true' || req.body.furnished === true,
      price_per_night: parseInt(req.body.price_per_night, 10),
      address: req.body.address,
      city: req.body.city,
      latitude: req.body.latitude ? parseFloat(req.body.latitude) : undefined,
      longitude: req.body.longitude ? parseFloat(req.body.longitude) : undefined,
      room_count: req.body.room_count != null ? parseInt(req.body.room_count, 10) : undefined,
      amenities: req.body.amenities ? JSON.parse(req.body.amenities) : [],
    };

    // Process images if provided
    let imageUrls: string[] = [];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const files = req.files as Express.Multer.File[];
      const imagePromises = files.map((file) =>
        imageService.uploadSingle(file.buffer, `properties/temp`, undefined)
      );
      imageUrls = await Promise.all(imagePromises);
    }

    // Create property first to get ID
    const property = await propertyService.createProperty(input, req.user.userId, imageUrls);

    // If images were uploaded, optimize them with property ID
    if (imageUrls.length > 0 && req.files && Array.isArray(req.files)) {
      const files = req.files as Express.Multer.File[];
      const optimizedImages = await Promise.all(
        files.map((file) => imageService.uploadAndOptimize(file.buffer, property.id))
      );

      // Update property with optimized image URLs
      const allImageUrls = optimizedImages.flatMap((img) => [
        img.thumbnail,
        img.medium,
        img.large,
      ]);
      await propertyService.updateProperty(property.id, { image_urls: allImageUrls });
      property.image_urls = allImageUrls;
    }

    sendSuccess(res, { property }, 'Propriété créée avec succès', 201);
  } catch (error: any) {
    if (error instanceof ValidationException || error instanceof BusinessRuleException) {
      sendError(res, error.message, error.code, error.statusCode);
      return;
    }
    logger.error('Create property controller error', { error: error.message });
    next(error);
  }
};

/**
 * Update property
 */
export const updateProperty = async (
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

    // Verify ownership
    const property = await propertyService.getPropertyById(id);
    if (property.owner_id !== req.user.userId && req.user.role !== 'admin') {
      sendError(res, 'Vous n\'êtes pas autorisé à modifier cette propriété', 'FORBIDDEN', 403);
      return;
    }

    const input: UpdatePropertyInput = {
      title: req.body.title,
      description: req.body.description,
      type: req.body.type,
      furnished: req.body.furnished !== undefined ? req.body.furnished === 'true' || req.body.furnished === true : undefined,
      price_per_night: req.body.price_per_night ? parseInt(req.body.price_per_night, 10) : undefined,
      address: req.body.address,
      city: req.body.city,
      latitude: req.body.latitude ? parseFloat(req.body.latitude) : undefined,
      longitude: req.body.longitude ? parseFloat(req.body.longitude) : undefined,
      room_count: req.body.room_count != null ? parseInt(req.body.room_count, 10) : undefined,
      amenities: req.body.amenities ? JSON.parse(req.body.amenities) : undefined,
    };

    const updatedProperty = await propertyService.updateProperty(id, input);
    sendSuccess(res, { property: updatedProperty }, 'Propriété mise à jour avec succès');
  } catch (error: any) {
    if (error instanceof NotFoundException || error instanceof ValidationException) {
      sendError(res, error.message, error.code, error.statusCode);
      return;
    }
    logger.error('Update property controller error', { error: error.message });
    next(error);
  }
};

/**
 * Delete property
 */
export const deleteProperty = async (
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

    // Verify ownership
    const property = await propertyService.getPropertyById(id);
    if (property.owner_id !== req.user.userId && req.user.role !== 'admin') {
      sendError(res, 'Vous n\'êtes pas autorisé à supprimer cette propriété', 'FORBIDDEN', 403);
      return;
    }

    await propertyService.deleteProperty(id);
    sendSuccess(res, null, 'Propriété supprimée avec succès');
  } catch (error: any) {
    if (error instanceof NotFoundException) {
      sendError(res, error.message, error.code, error.statusCode);
      return;
    }
    logger.error('Delete property controller error', { error: error.message });
    next(error);
  }
};

/**
 * Get bookings for a property (for availability check)
 * Returns only accepted and pending bookings to show unavailable dates
 */
export const getPropertyBookings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Verify property exists
    await propertyService.getPropertyById(id);

    // Get bookings for this property (accepted and pending only)
    const bookings = await bookingService.getPropertyBookings(id);
    
    sendSuccess(res, { bookings }, 'Réservations récupérées avec succès');
  } catch (error: any) {
    if (error instanceof NotFoundException || error instanceof BusinessRuleException) {
      sendError(res, error.message, error.code, error.statusCode);
      return;
    }
    logger.error('Get property bookings controller error', { error: error.message });
    next(error);
  }
};

/**
 * Get blocked dates for a property (owner-defined unavailability)
 */
export const getBlockedDates = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const property = await propertyService.getPropertyById(id);
    if (req.user && req.user.role !== 'admin' && property.owner_id !== req.user.userId) {
      sendError(res, 'Accès non autorisé', 'FORBIDDEN', 403);
      return;
    }
    const dates = await availabilityService.getBlockedDates(id);
    sendSuccess(res, { dates }, 'Dates bloquées récupérées avec succès');
  } catch (error: any) {
    if (error instanceof NotFoundException || error instanceof BusinessRuleException) {
      sendError(res, error.message, error.code, error.statusCode);
      return;
    }
    logger.error('Get blocked dates controller error', { error: error.message });
    next(error);
  }
};

/**
 * Add blocked dates for a property (owner only)
 */
export const addBlockedDates = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const property = await propertyService.getPropertyById(id);
    if (req.user!.role !== 'admin' && property.owner_id !== req.user!.userId) {
      sendError(res, 'Seul le propriétaire peut gérer la disponibilité', 'FORBIDDEN', 403);
      return;
    }
    const dates = Array.isArray(req.body.dates) ? req.body.dates : (req.body.dates ? [req.body.dates] : []);
    const added = await availabilityService.addBlockedDates(id, dates);
    sendSuccess(res, { dates: added }, 'Dates bloquées ajoutées avec succès');
  } catch (error: any) {
    if (error instanceof NotFoundException || error instanceof ValidationException || error instanceof BusinessRuleException) {
      sendError(res, error.message, error.code, error.statusCode);
      return;
    }
    logger.error('Add blocked dates controller error', { error: error.message });
    next(error);
  }
};

/**
 * Remove blocked dates for a property (owner only)
 */
export const removeBlockedDates = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const property = await propertyService.getPropertyById(id);
    if (req.user!.role !== 'admin' && property.owner_id !== req.user!.userId) {
      sendError(res, 'Seul le propriétaire peut gérer la disponibilité', 'FORBIDDEN', 403);
      return;
    }
    const dates = Array.isArray(req.body.dates) ? req.body.dates : (req.body.dates ? [req.body.dates] : []);
    await availabilityService.removeBlockedDates(id, dates);
    sendSuccess(res, null, 'Dates bloquées supprimées avec succès');
  } catch (error: any) {
    if (error instanceof NotFoundException || error instanceof BusinessRuleException) {
      sendError(res, error.message, error.code, error.statusCode);
      return;
    }
    logger.error('Remove blocked dates controller error', { error: error.message });
    next(error);
  }
};

