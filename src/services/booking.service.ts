import { SupabaseService } from './supabase.service';
import { Booking, CreateBookingInput, UpdateBookingStatusInput, BookingWithProperty } from '../models/Booking.model';
import { NotFoundException, ValidationException, BusinessRuleException, InfrastructureException } from '../utils/errors';
import { logger } from '../utils/logger';
import { propertyService } from './property.service';
import { chatService } from './chat.service';

/**
 * Booking service for booking management
 */
export class BookingService extends SupabaseService {
  /**
   * Get bookings for a user (client or owner)
   */
  async getBookings(userId: string, role: string): Promise<BookingWithProperty[]> {
    try {
      let query;

      if (role === 'client') {
        // Get bookings where user is the client
        query = this.client
          .from('bookings')
          .select('*, property:properties(id, title, city, image_urls)')
          .eq('client_id', userId)
          .order('created_at', { ascending: false });
      } else if (role === 'owner') {
        // Get bookings for properties owned by user
        // First get property IDs owned by user, then get bookings
        const { data: properties } = await this.client
          .from('properties')
          .select('id')
          .eq('owner_id', userId);

        const propertyIds = properties?.map((p) => p.id) || [];

        if (propertyIds.length === 0) {
          return [];
        }

        query = this.client
          .from('bookings')
          .select('*, property:properties(id, title, city, image_urls)')
          .in('property_id', propertyIds)
          .order('created_at', { ascending: false });
      } else {
        // Admin can see all
        query = this.client
          .from('bookings')
          .select('*, property:properties(id, title, city, image_urls)')
          .order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        throw new InfrastructureException(`Erreur lors de la récupération des réservations: ${error.message}`, error);
      }

      return (data as BookingWithProperty[]) || [];
    } catch (error: any) {
      if (error instanceof InfrastructureException) {
        throw error;
      }
      logger.error('Get bookings error', { error: error.message, userId, role });
      throw new BusinessRuleException('Erreur lors de la récupération des réservations', error);
    }
  }

  /**
   * Get booking by ID
   */
  async getBookingById(id: string, userId: string, userRole: string): Promise<BookingWithProperty> {
    try {
      const { data, error } = await this.client
        .from('bookings')
        .select('*, property:properties(id, title, city, image_urls)')
        .eq('id', id)
        .single();

      if (error) {
        throw new InfrastructureException(`Erreur lors de la récupération de la réservation: ${error.message}`, error);
      }

      if (!data) {
        throw new NotFoundException('Réservation non trouvée');
      }

      const booking = data as BookingWithProperty;

      // Check access: client can see their bookings, owner can see bookings for their properties
      if (userRole !== 'admin') {
        if (userRole === 'client' && booking.client_id !== userId) {
          throw new ValidationException('Accès non autorisé à cette réservation');
        }
        if (userRole === 'owner') {
          const property = await propertyService.getPropertyById(booking.property_id);
          if (property.owner_id !== userId) {
            throw new ValidationException('Accès non autorisé à cette réservation');
          }
        }
      }

      return booking;
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof ValidationException) {
        throw error;
      }
      logger.error('Get booking error', { error: error.message, id });
      throw new BusinessRuleException('Erreur lors de la récupération de la réservation', error);
    }
  }

  /**
   * Create booking
   */
  async createBooking(input: CreateBookingInput, clientId: string): Promise<Booking> {
    try {
      // Validate dates
      const startDate = new Date(input.start_date);
      const endDate = new Date(input.end_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (startDate < today) {
        throw new ValidationException('La date de début doit être dans le futur');
      }

      if (endDate <= startDate) {
        throw new ValidationException('La date de fin doit être après la date de début');
      }

      // Check property exists
      const property = await propertyService.getPropertyById(input.property_id);

      // Check availability (no overlapping accepted bookings)
      const { data: overlappingBookings, error: availabilityError } = await this.client
        .from('bookings')
        .select('*')
        .eq('property_id', input.property_id)
        .in('status', ['pending', 'accepted'])
        .or(
          `and(start_date.lte.${input.end_date},end_date.gte.${input.start_date})`
        );

      if (availabilityError) {
        throw new InfrastructureException(
          `Erreur lors de la vérification de la disponibilité: ${availabilityError.message}`,
          availabilityError
        );
      }

      if (overlappingBookings && overlappingBookings.length > 0) {
        throw new BusinessRuleException('La propriété n\'est pas disponible pour ces dates');
      }

      // Calculate nights and total price
      const nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const totalPrice = nights * property.price_per_night;

      // Create booking
      const booking = await this.executeQuery<Booking>(
        async () =>
          await this.client
            .from('bookings')
            .insert({
              property_id: input.property_id,
              client_id: clientId,
              start_date: input.start_date,
              end_date: input.end_date,
              nights,
              guests: input.guests,
              message: input.message,
              total_price: totalPrice,
              status: 'pending',
            })
            .select()
            .single()
      );

      // Auto-create conversation for this booking
      // Use a fire-and-forget approach - don't let conversation creation failure break booking creation
      chatService
        .createConversationForBooking(booking.id, clientId)
        .then(() => {
          // After conversation is created, add a system message about the booking creation
          return chatService.createSystemMessageForBookingStatus(
            booking.id,
            'pending',
            property.title
          );
        })
        .catch((error) => {
          logger.warn('Failed to auto-create conversation or system message for booking', {
            bookingId: booking.id,
            error: error.message,
          });
        });

      return booking;
    } catch (error: any) {
      if (error instanceof ValidationException || error instanceof BusinessRuleException) {
        throw error;
      }
      logger.error('Create booking error', { error: error.message, clientId });
      throw new BusinessRuleException('Erreur lors de la création de la réservation', error);
    }
  }

  /**
   * Update booking status (owner only)
   */
  async updateBookingStatus(id: string, input: UpdateBookingStatusInput, ownerId: string): Promise<Booking> {
    try {
      // Get booking
      const booking = await this.getBookingById(id, ownerId, 'owner');

      // Verify owner has access to this booking's property
      const property = await propertyService.getPropertyById(booking.property_id);
      if (property.owner_id !== ownerId) {
        throw new ValidationException('Vous n\'êtes pas autorisé à modifier cette réservation');
      }

      // Update status
      const updatedBooking = await this.executeQuery<Booking>(
        async () =>
          await this.client
            .from('bookings')
            .update({
              status: input.status,
              updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single()
      );

      // Create system message in conversation for status change
      chatService
        .createSystemMessageForBookingStatus(id, input.status, property.title)
        .catch((error) => {
          logger.warn('Failed to create system message for booking status change', {
            bookingId: id,
            status: input.status,
            error: error.message,
          });
        });

      return updatedBooking;
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof ValidationException) {
        throw error;
      }
      logger.error('Update booking status error', { error: error.message, id });
      throw new BusinessRuleException('Erreur lors de la mise à jour du statut de la réservation', error);
    }
  }

  /**
   * Cancel booking
   */
  async cancelBooking(id: string, userId: string, userRole: string): Promise<void> {
    try {
      // Get booking
      const booking = await this.getBookingById(id, userId, userRole);

      // Check permissions: client can cancel pending, owner can cancel any
      if (userRole === 'client' && booking.client_id !== userId) {
        throw new ValidationException('Vous n\'êtes pas autorisé à annuler cette réservation');
      }

      if (userRole === 'client' && booking.status !== 'pending') {
        throw new BusinessRuleException('Seules les réservations en attente peuvent être annulées');
      }

      // If owner, verify they own the property
      if (userRole === 'owner') {
        const property = await propertyService.getPropertyById(booking.property_id);
        if (property.owner_id !== userId) {
          throw new ValidationException('Vous n\'êtes pas autorisé à annuler cette réservation');
        }
      }

      // Get property for system message
      const property = await propertyService.getPropertyById(booking.property_id);

      // Update status to cancelled
      await this.executeQuery(
        async () =>
          await this.client
            .from('bookings')
            .update({
              status: 'cancelled',
              updated_at: new Date().toISOString(),
            })
            .eq('id', id)
      );

      // Create system message in conversation for cancellation
      chatService
        .createSystemMessageForBookingStatus(id, 'cancelled', property.title)
        .catch((error) => {
          logger.warn('Failed to create system message for booking cancellation', {
            bookingId: id,
            error: error.message,
          });
        });
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof ValidationException || error instanceof BusinessRuleException) {
        throw error;
      }
      logger.error('Cancel booking error', { error: error.message, id });
      throw new BusinessRuleException('Erreur lors de l\'annulation de la réservation', error);
    }
  }
}

export const bookingService = new BookingService();

