import { SupabaseService } from './supabase.service';
import {
  Conversation,
  ConversationWithDetails,
  Message,
  MessageWithSender,
  CreateConversationInput,
  CreateMessageInput,
  PaginatedMessages,
} from '../models/Chat.model';
import {
  NotFoundException,
  ValidationException,
  BusinessRuleException,
  InfrastructureException,
} from '../utils/errors';
import { logger } from '../utils/logger';
import { bookingService } from './booking.service';
import { propertyService } from './property.service';

/**
 * Chat service for conversation and message management
 */
export class ChatService extends SupabaseService {
  /**
   * Get conversations for a user (filtered by role: client or owner)
   */
  async getConversations(
    userId: string,
    role: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<ConversationWithDetails[]> {
    try {
      let query;

      if (role === 'client') {
        // Get conversations where user is the client
        query = this.client
          .from('conversations')
          .select(
            `
            *,
            client:users!conversations_client_id_fkey(id, full_name, email),
            owner:users!conversations_owner_id_fkey(id, full_name, email),
            booking:bookings!conversations_booking_id_fkey(
              start_date,
              end_date,
              property:properties!bookings_property_id_fkey(id, title, type)
            )
          `
          )
          .eq('client_id', userId)
          .order('last_message_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
      } else if (role === 'owner') {
        // Get conversations where user is the owner
        query = this.client
          .from('conversations')
          .select(
            `
            *,
            client:users!conversations_client_id_fkey(id, full_name, email),
            owner:users!conversations_owner_id_fkey(id, full_name, email),
            booking:bookings!conversations_booking_id_fkey(
              start_date,
              end_date,
              property:properties!bookings_property_id_fkey(id, title, type)
            )
          `
          )
          .eq('owner_id', userId)
          .order('last_message_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
      } else {
        // Admin can see all
        query = this.client
          .from('conversations')
          .select(
            `
            *,
            client:users!conversations_client_id_fkey(id, full_name, email),
            owner:users!conversations_owner_id_fkey(id, full_name, email),
            booking:bookings!conversations_booking_id_fkey(
              start_date,
              end_date,
              property:properties!bookings_property_id_fkey(id, title, type)
            )
          `
          )
          .order('last_message_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw new InfrastructureException(
          `Erreur lors de la récupération des conversations: ${error.message}`,
          error
        );
      }

      const conversations = (data as ConversationWithDetails[]) || [];

      // Get unread counts and last message for each conversation
      const conversationsWithDetails = await Promise.all(
        conversations.map(async (conv) => {
          const [unreadCount, lastMessage] = await Promise.all([
            this.getUnreadCount(conv.id, userId),
            this.getLastMessage(conv.id),
          ]);

          // Extract property title and booking start date from booking relation
          let propertyTitle: string | undefined;
          let bookingStartDate: string | undefined;
          
          const bookingData = (conv as any).booking;
          if (bookingData) {
            // Try multiple ways to access property title (handle different Supabase response formats)
            if (bookingData.property) {
              // Format 1: booking.property.title (nested object)
              if (typeof bookingData.property === 'object' && !Array.isArray(bookingData.property)) {
                // Make sure we use 'title' and NOT 'type'
                if (bookingData.property.title) {
                  propertyTitle = bookingData.property.title;
                  // Double check: if title is actually a type value, log warning
                  if (propertyTitle === 'apartment' || propertyTitle === 'villa') {
                    logger.error('Property title appears to be a type value instead of title!', { 
                      conversationId: conv.id,
                      propertyTitle: propertyTitle,
                      propertyType: bookingData.property.type,
                      propertyData: bookingData.property
                    });
                  } else {
                    logger.debug('Extracted property title from booking.property.title', { 
                      conversationId: conv.id,
                      propertyTitle: propertyTitle
                    });
                  }
                } else if (bookingData.property.type) {
                  // If title is missing but type exists, this is a problem
                  logger.error('Property title is missing but type exists - using type as fallback (THIS IS WRONG)', { 
                    conversationId: conv.id,
                    propertyType: bookingData.property.type,
                    propertyKeys: Object.keys(bookingData.property)
                  });
                  // DO NOT use type - this is wrong
                  propertyTitle = undefined;
                } else {
                  logger.warn('Property title field is missing in booking.property', { 
                    conversationId: conv.id,
                    propertyKeys: Object.keys(bookingData.property),
                    propertyData: bookingData.property
                  });
                }
              }
              // Format 2: booking.property might be an array (Supabase sometimes returns arrays)
              else if (Array.isArray(bookingData.property) && bookingData.property.length > 0) {
                const firstProperty = bookingData.property[0];
                if (firstProperty && firstProperty.title) {
                  propertyTitle = firstProperty.title;
                  logger.debug('Extracted property title from booking.property[0].title', { 
                    conversationId: conv.id,
                    propertyTitle: propertyTitle
                  });
                } else {
                  logger.warn('Property title field is missing in booking.property[0]', { 
                    conversationId: conv.id,
                    propertyKeys: firstProperty ? Object.keys(firstProperty) : []
                  });
                }
              }
            }
            
            // Log warning if property title is still missing
            if (!propertyTitle) {
              logger.warn('Property title not found in booking data', { 
                conversationId: conv.id,
                bookingId: bookingData.id,
                hasBooking: !!bookingData,
                hasProperty: !!bookingData.property,
                bookingStructure: JSON.stringify(bookingData, null, 2)
              });
            }
            
            if (bookingData.start_date) {
              bookingStartDate = bookingData.start_date;
            }
          }

          return {
            ...conv,
            property_title: propertyTitle,
            booking_start_date: bookingStartDate,
            unread_count: unreadCount,
            last_message: lastMessage,
          };
        })
      );

      return conversationsWithDetails;
    } catch (error: any) {
      if (error instanceof InfrastructureException) {
        throw error;
      }
      logger.error('Get conversations error', { error: error.message, userId, role });
      throw new BusinessRuleException(
        'Erreur lors de la récupération des conversations',
        error
      );
    }
  }

  /**
   * Get conversation by ID with details
   */
  async getConversationById(
    id: string,
    userId: string,
    userRole: string
  ): Promise<ConversationWithDetails> {
    try {
      const { data, error } = await this.client
        .from('conversations')
        .select(
          `
          *,
          client:users!conversations_client_id_fkey(id, full_name, email),
          owner:users!conversations_owner_id_fkey(id, full_name, email),
          booking:bookings!conversations_booking_id_fkey(
            start_date,
            end_date,
            property:properties!bookings_property_id_fkey(id, title, type)
          )
        `
        )
        .eq('id', id)
        .single();

      if (error) {
        throw new InfrastructureException(
          `Erreur lors de la récupération de la conversation: ${error.message}`,
          error
        );
      }

      if (!data) {
        throw new NotFoundException('Conversation non trouvée');
      }

      const conversation = data as any;

      // Check access: user must be client or owner
      if (userRole !== 'admin') {
        if (
          conversation.client_id !== userId &&
          conversation.owner_id !== userId
        ) {
          throw new ValidationException('Accès non autorisé à cette conversation');
        }
      }

      // Extract property title and booking dates from booking relation
      let propertyTitle: string | undefined;
      let bookingStartDate: string | undefined;
      
      const bookingData = conversation.booking;
      if (bookingData) {
        // Try multiple ways to access property title (handle different Supabase response formats)
        if (bookingData.property) {
          // Format 1: booking.property.title (nested object)
          if (typeof bookingData.property === 'object' && !Array.isArray(bookingData.property)) {
            // Make sure we use 'title' and NOT 'type'
            if (bookingData.property.title) {
              propertyTitle = bookingData.property.title;
              // Double check: if title is actually a type value, log warning
              if (propertyTitle === 'apartment' || propertyTitle === 'villa') {
                logger.error('Property title appears to be a type value instead of title! (getConversationById)', { 
                  conversationId: conversation.id,
                  propertyTitle: propertyTitle,
                  propertyType: bookingData.property.type,
                  propertyData: bookingData.property
                });
              } else {
                logger.debug('Extracted property title from booking.property.title in getConversationById', { 
                  conversationId: conversation.id,
                  propertyTitle: propertyTitle
                });
              }
            } else if (bookingData.property.type) {
              // If title is missing but type exists, this is a problem
              logger.error('Property title is missing but type exists - using type as fallback (THIS IS WRONG) (getConversationById)', { 
                conversationId: conversation.id,
                propertyType: bookingData.property.type,
                propertyKeys: Object.keys(bookingData.property)
              });
              // DO NOT use type - this is wrong
              propertyTitle = undefined;
            } else {
              logger.warn('Property title field is missing in booking.property for getConversationById', { 
                conversationId: conversation.id,
                propertyKeys: Object.keys(bookingData.property),
                propertyData: bookingData.property
              });
            }
          }
          // Format 2: booking.property might be an array (Supabase sometimes returns arrays)
          else if (Array.isArray(bookingData.property) && bookingData.property.length > 0) {
            const firstProperty = bookingData.property[0];
            if (firstProperty && firstProperty.title) {
              propertyTitle = firstProperty.title;
              logger.debug('Extracted property title from booking.property[0].title in getConversationById', { 
                conversationId: conversation.id,
                propertyTitle: propertyTitle
              });
            } else {
              logger.warn('Property title field is missing in booking.property[0] for getConversationById', { 
                conversationId: conversation.id,
                propertyKeys: firstProperty ? Object.keys(firstProperty) : []
              });
            }
          }
        }
        
        // Log warning if property title is still missing
        if (!propertyTitle) {
          logger.warn('Property title not found in booking data for conversation', { 
            conversationId: conversation.id,
            bookingId: bookingData.id,
            hasBooking: !!bookingData,
            hasProperty: !!bookingData.property,
            bookingStructure: JSON.stringify(bookingData, null, 2)
          });
        }
        
        if (bookingData.start_date) {
          bookingStartDate = bookingData.start_date;
        }
      }

      // Get unread count and last message
      const [unreadCount, lastMessage] = await Promise.all([
        this.getUnreadCount(conversation.id, userId),
        this.getLastMessage(conversation.id),
      ]);

      return {
        ...conversation,
        property_title: propertyTitle,
        booking_start_date: bookingStartDate,
        unread_count: unreadCount,
        last_message: lastMessage,
      };
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof ValidationException) {
        throw error;
      }
      logger.error('Get conversation error', { error: error.message, id });
      throw new BusinessRuleException(
        'Erreur lors de la récupération de la conversation',
        error
      );
    }
  }

  /**
   * Create conversation (auto-create if booking exists)
   */
  async createConversation(
    input: CreateConversationInput,
    userId: string,
    userRole: string
  ): Promise<ConversationWithDetails> {
    try {
      // Get booking to verify it exists and user has access
      const booking = await bookingService.getBookingById(
        input.booking_id,
        userId,
        userRole
      );

      // Check if conversation already exists for this booking
      const existingConversationResult = await this.client
        .from('conversations')
        .select('*')
        .eq('booking_id', input.booking_id);

      if (existingConversationResult.error && existingConversationResult.error.code !== 'PGRST116') {
        throw new InfrastructureException(
          `Erreur lors de la vérification de la conversation: ${existingConversationResult.error.message}`,
          existingConversationResult.error
        );
      }

      if (
        existingConversationResult.data &&
        existingConversationResult.data.length > 0
      ) {
        // Return existing conversation
        const existingConv = existingConversationResult.data[0] as Conversation;
        return await this.getConversationById(existingConv.id, userId, userRole);
      }

      // Get property to find owner_id
      const property = await propertyService.getPropertyById(booking.property_id);

      // Create conversation
      const { data, error } = await this.client
        .from('conversations')
        .insert({
          booking_id: input.booking_id,
          client_id: booking.client_id,
          owner_id: property.owner_id,
        })
        .select(
          `
          *,
          client:users!conversations_client_id_fkey(id, full_name, email),
          owner:users!conversations_owner_id_fkey(id, full_name, email),
          booking:bookings!conversations_booking_id_fkey(
            start_date,
            end_date,
            property:properties!bookings_property_id_fkey(id, title, type)
          )
        `
        )
        .single();

      if (error) {
        throw new InfrastructureException(
          `Erreur lors de la création de la conversation: ${error.message}`,
          error
        );
      }

      if (!data) {
        throw new InfrastructureException('La conversation n\'a pas pu être créée');
      }

      const conversation = data as any;

      // Extract property title and booking start date from booking relation
      let propertyTitle: string | undefined;
      let bookingStartDate: string | undefined;
      
      const bookingData = conversation.booking;
      if (bookingData) {
        if (bookingData.property) {
          if (typeof bookingData.property === 'object' && !Array.isArray(bookingData.property)) {
            if (bookingData.property.title) {
              propertyTitle = bookingData.property.title;
              logger.debug('Property bound to conversation in createConversation', {
                conversationId: conversation.id,
                propertyId: bookingData.property.id,
                propertyTitle: propertyTitle,
                propertyType: bookingData.property.type,
              });
            }
          } else if (Array.isArray(bookingData.property) && bookingData.property.length > 0) {
            propertyTitle = bookingData.property[0].title;
            logger.debug('Property bound to conversation in createConversation (array format)', {
              conversationId: conversation.id,
              propertyId: bookingData.property[0].id,
              propertyTitle: propertyTitle,
            });
          }
        }
        
        if (bookingData.start_date) {
          bookingStartDate = bookingData.start_date;
        }
      }

      if (!propertyTitle) {
        logger.warn('Property title not found when creating conversation', {
          conversationId: conversation.id,
          bookingId: input.booking_id,
          hasBooking: !!bookingData,
          hasProperty: !!bookingData?.property,
        });
      }

      // Get unread count and last message
      const [unreadCount, lastMessage] = await Promise.all([
        this.getUnreadCount(conversation.id, userId),
        this.getLastMessage(conversation.id),
      ]);

      return {
        ...conversation,
        property_title: propertyTitle,
        booking_start_date: bookingStartDate,
        unread_count: unreadCount,
        last_message: lastMessage,
      };
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof ValidationException ||
        error instanceof BusinessRuleException
      ) {
        throw error;
      }
      logger.error('Create conversation error', { error: error.message, userId });
      throw new BusinessRuleException(
        'Erreur lors de la création de la conversation',
        error
      );
    }
  }

  /**
   * Get messages for a conversation with pagination
   */
  async getMessages(
    conversationId: string,
    userId: string,
    userRole: string,
    page: number = 1,
    limit: number = 50
  ): Promise<PaginatedMessages> {
    try {
      // Verify user has access to this conversation
      await this.getConversationById(conversationId, userId, userRole);

      const offset = (page - 1) * limit;

      // Get total count
      const { count, error: countError } = await this.client
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conversationId);

      if (countError) {
        throw new InfrastructureException(
          `Erreur lors du comptage des messages: ${countError.message}`,
          countError
        );
      }

      const total = count || 0;

      // Get messages with sender details
      const { data, error } = await this.client
        .from('messages')
        .select(
          `
          *,
          sender:users!messages_sender_id_fkey(id, full_name, email)
        `
        )
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new InfrastructureException(
          `Erreur lors de la récupération des messages: ${error.message}`,
          error
        );
      }

      const messages = ((data as MessageWithSender[]) || []).reverse(); // Reverse to get chronological order

      const pages = Math.ceil(total / limit);

      return {
        messages,
        pagination: {
          page,
          limit,
          total,
          pages,
        },
      };
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof ValidationException) {
        throw error;
      }
      logger.error('Get messages error', { error: error.message, conversationId });
      throw new BusinessRuleException(
        'Erreur lors de la récupération des messages',
        error
      );
    }
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(
    conversationId: string,
    input: CreateMessageInput,
    senderId: string,
    userRole: string
  ): Promise<MessageWithSender> {
    try {
      // Verify user has access to this conversation
      await this.getConversationById(conversationId, senderId, userRole);

      // Validate content
      if (!input.content || input.content.trim().length === 0) {
        throw new ValidationException('Le contenu du message ne peut pas être vide');
      }

      if (input.content.length > 5000) {
        throw new ValidationException('Le message ne peut pas dépasser 5000 caractères');
      }

      // Create message
      const { data, error } = await this.client
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content: input.content.trim(),
          is_read: false,
          message_type: input.message_type || 'user',
          file_url: input.file_url,
          file_name: input.file_name,
          file_size: input.file_size,
        })
        .select(
          `
          *,
          sender:users!messages_sender_id_fkey(id, full_name, email)
        `
        )
        .single();

      if (error) {
        throw new InfrastructureException(
          `Erreur lors de l'envoi du message: ${error.message}`,
          error
        );
      }

      if (!data) {
        throw new InfrastructureException('Le message n\'a pas pu être créé');
      }

      return data as MessageWithSender;
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof ValidationException
      ) {
        throw error;
      }
      logger.error('Send message error', { error: error.message, conversationId, senderId });
      throw new BusinessRuleException('Erreur lors de l\'envoi du message', error);
    }
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: string, userId: string, userRole: string): Promise<void> {
    try {
      // Get message to verify it exists and user has access
      const { data: message, error: messageError } = await this.client
        .from('messages')
        .select('*, conversation:conversations(*)')
        .eq('id', messageId)
        .single();

      if (messageError) {
        throw new InfrastructureException(
          `Erreur lors de la récupération du message: ${messageError.message}`,
          messageError
        );
      }

      if (!message) {
        throw new NotFoundException('Message non trouvé');
      }

      const conversation = (message as any).conversation as Conversation;

      // Check access: user must be part of the conversation
      if (userRole !== 'admin') {
        if (conversation.client_id !== userId && conversation.owner_id !== userId) {
          throw new ValidationException('Accès non autorisé à ce message');
        }
      }

      // Only mark as read if user is not the sender
      if ((message as Message).sender_id === userId) {
        // Sender already sees their own messages as read, no need to update
        return;
      }

      // Update message
      const { error: updateError } = await this.client
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId)
        .eq('conversation_id', conversation.id);

      if (updateError) {
        throw new InfrastructureException(
          `Erreur lors de la mise à jour du message: ${updateError.message}`,
          updateError
        );
      }
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof ValidationException) {
        throw error;
      }
      logger.error('Mark message as read error', { error: error.message, messageId });
      throw new BusinessRuleException(
        'Erreur lors de la mise à jour du message',
        error
      );
    }
  }

  /**
   * Get unread message count for a conversation
   */
  async getUnreadCount(conversationId: string, userId: string): Promise<number> {
    try {
      // Get conversation to determine the other participant
      const conversation = await this.executeQueryNullable<Conversation>(
        async () =>
          await this.client
            .from('conversations')
            .select('*')
            .eq('id', conversationId)
            .single()
      );

      if (!conversation) {
        return 0;
      }

      // Count unread messages where sender is not the current user
      const { count, error } = await this.client
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conversationId)
        .eq('is_read', false)
        .neq('sender_id', userId);

      if (error) {
        logger.warn('Get unread count error', { error: error.message, conversationId });
        return 0;
      }

      return count || 0;
    } catch (error: any) {
      logger.warn('Get unread count error', { error: error.message, conversationId });
      return 0;
    }
  }

  /**
   * Get last message for a conversation
   */
  private async getLastMessage(conversationId: string): Promise<MessageWithSender | undefined> {
    try {
      const { data, error } = await this.client
        .from('messages')
        .select(
          `
          *,
          sender:users!messages_sender_id_fkey(id, full_name, email)
        `
        )
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return undefined;
      }

      return data as MessageWithSender;
    } catch (error: any) {
      return undefined;
    }
  }

  /**
   * Create conversation automatically when booking is created
   * Called by booking service after creating a booking
   */
  async createConversationForBooking(bookingId: string, clientId: string): Promise<void> {
    try {
      // Check if conversation already exists
      const existingConversationResult = await this.client
        .from('conversations')
        .select('*')
        .eq('booking_id', bookingId);

      if (existingConversationResult.error && existingConversationResult.error.code !== 'PGRST116') {
        logger.error('Error checking existing conversation', {
          error: existingConversationResult.error.message,
          bookingId,
        });
        return; // Don't throw, just log - conversation creation is not critical
      }

      if (
        existingConversationResult.data &&
        existingConversationResult.data.length > 0
      ) {
        // Conversation already exists
        return;
      }

      // Get booking with property to find owner_id and ensure property is bound
      const booking = await this.executeQueryNullable<any>(
        async () =>
          await this.client
            .from('bookings')
            .select(`
              property_id,
              property:properties!bookings_property_id_fkey(id, title, owner_id)
            `)
            .eq('id', bookingId)
            .single()
      );

      if (!booking) {
        logger.warn('Booking not found when creating conversation', { bookingId });
        return;
      }

      // Extract property info - handle both object and array formats
      let propertyOwnerId: string | undefined;
      let propertyTitle: string | undefined;
      
      if (booking.property) {
        if (typeof booking.property === 'object' && !Array.isArray(booking.property)) {
          propertyOwnerId = booking.property.owner_id;
          propertyTitle = booking.property.title;
        } else if (Array.isArray(booking.property) && booking.property.length > 0) {
          propertyOwnerId = booking.property[0].owner_id;
          propertyTitle = booking.property[0].title;
        }
      }

      if (!propertyOwnerId) {
        // Fallback: get property directly if not in relation
        const property = await this.executeQueryNullable<any>(
          async () =>
            await this.client
              .from('properties')
              .select('owner_id, title')
              .eq('id', booking.property_id)
              .single()
        );

        if (!property) {
          logger.warn('Property not found when creating conversation', {
            bookingId,
            propertyId: booking.property_id,
          });
          return;
        }
        propertyOwnerId = property.owner_id;
        propertyTitle = property.title;
      }

      logger.info('Creating conversation with property binding', {
        bookingId,
        propertyId: booking.property_id,
        propertyTitle: propertyTitle,
        ownerId: propertyOwnerId,
      });

      // Create conversation
      const { error } = await this.client.from('conversations').insert({
        booking_id: bookingId,
        client_id: clientId,
        owner_id: propertyOwnerId,
      });

      if (error) {
        logger.error('Error creating conversation for booking', {
          error: error.message,
          bookingId,
        });
        // Don't throw - conversation creation is not critical for booking
      } else {
        logger.info('Conversation created automatically for booking', { bookingId });
      }
    } catch (error: any) {
      logger.error('Error in createConversationForBooking', {
        error: error.message,
        bookingId,
      });
      // Don't throw - conversation creation should not break booking creation
    }
  }

  /**
   * Create a system message in a conversation for booking status changes
   * This is called by booking service when booking status changes
   */
  async createSystemMessageForBookingStatus(
    bookingId: string,
    status: string,
    propertyTitle?: string
  ): Promise<void> {
    try {
      // Get conversation for this booking
      const conversationResult = await this.client
        .from('conversations')
        .select('id')
        .eq('booking_id', bookingId)
        .single();

      if (conversationResult.error || !conversationResult.data) {
        logger.warn('No conversation found for booking when creating system message', {
          bookingId,
          error: conversationResult.error?.message,
        });
        return; // Don't throw - system message is not critical
      }

      const conversationId = conversationResult.data.id;

      // Get conversation details to find client_id and owner_id
      const conversationDetails = await this.executeQueryNullable<Conversation>(
        async () =>
          await this.client
            .from('conversations')
            .select('*')
            .eq('id', conversationId)
            .single()
      );

      if (!conversationDetails) {
        logger.warn('Conversation details not found', { conversationId });
        return;
      }

      // Create appropriate message based on status
      let messageContent = '';
      let senderId = conversationDetails.owner_id; // Default to owner for system messages

      switch (status) {
        case 'pending':
          messageContent = propertyTitle
            ? `Une nouvelle réservation pour "${propertyTitle}" a été créée et est en attente de confirmation.`
            : 'Une nouvelle réservation a été créée et est en attente de confirmation.';
          senderId = conversationDetails.client_id; // Client creates the booking
          break;
        case 'accepted':
          messageContent = propertyTitle
            ? `Votre réservation pour "${propertyTitle}" a été acceptée.`
            : 'Votre réservation a été acceptée.';
          senderId = conversationDetails.owner_id;
          break;
        case 'declined':
          messageContent = propertyTitle
            ? `Votre réservation pour "${propertyTitle}" a été refusée.`
            : 'Votre réservation a été refusée.';
          senderId = conversationDetails.owner_id;
          break;
        case 'cancelled':
          messageContent = propertyTitle
            ? `La réservation pour "${propertyTitle}" a été annulée.`
            : 'La réservation a été annulée.';
          // For cancelled, determine who cancelled based on context
          // Default to owner for now
          senderId = conversationDetails.owner_id;
          break;
        default:
          messageContent = propertyTitle
            ? `Le statut de la réservation pour "${propertyTitle}" a été mis à jour : ${status}`
            : `Le statut de la réservation a été mis à jour : ${status}`;
          senderId = conversationDetails.owner_id;
      }

      // Create system message
      const { error } = await this.client.from('messages').insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: messageContent,
        is_read: false,
        message_type: 'system',
      });

      if (error) {
        logger.error('Error creating system message for booking status', {
          error: error.message,
          bookingId,
          conversationId,
          status,
        });
      } else {
        logger.info('System message created for booking status change', {
          bookingId,
          conversationId,
          status,
        });
      }
    } catch (error: any) {
      logger.error('Error in createSystemMessageForBookingStatus', {
        error: error.message,
        bookingId,
        status,
      });
      // Don't throw - system message creation should not break booking update
    }
  }
}

export const chatService = new ChatService();

