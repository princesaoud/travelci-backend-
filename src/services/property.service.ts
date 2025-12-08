import { SupabaseService } from './supabase.service';
import { Property, CreatePropertyInput, UpdatePropertyInput, PropertyFilters } from '../models/Property.model';
import { NotFoundException, ValidationException, BusinessRuleException, InfrastructureException } from '../utils/errors';
import { logger } from '../utils/logger';
import { cacheService } from '../utils/cache';
import { imageService } from './image.service';

/**
 * Property service for property management
 */
export class PropertyService extends SupabaseService {
  /**
   * Get properties with filters and pagination
   */
  async getProperties(filters: PropertyFilters = {}): Promise<{
    properties: Property[];
    total: number;
  }> {
    try {
      let query = this.client.from('properties').select('*', { count: 'exact' });

      // Apply filters
      if (filters.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.furnished !== undefined) {
        query = query.eq('furnished', filters.furnished);
      }
      if (filters.priceMin) {
        query = query.gte('price_per_night', filters.priceMin);
      }
      if (filters.priceMax) {
        query = query.lte('price_per_night', filters.priceMax);
      }

      // Pagination
      const page = filters.page || 1;
      const limit = Math.min(filters.limit || 20, 100);
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      query = query.order('created_at', { ascending: false }).range(from, to);

      const { data, error, count } = await query;

      if (error) {
        throw new InfrastructureException(`Erreur lors de la récupération des propriétés: ${error.message}`, error);
      }

      return {
        properties: (data as Property[]) || [],
        total: count || 0,
      };
    } catch (error: any) {
      if (error instanceof InfrastructureException) {
        throw error;
      }
      logger.error('Get properties error', { error: error.message, filters });
      throw new BusinessRuleException('Erreur lors de la récupération des propriétés', error);
    }
  }

  /**
   * Get property by ID
   */
  async getPropertyById(id: string): Promise<Property> {
    try {
      const property = await this.executeQueryNullable<Property>(
        async () =>
          await this.client
            .from('properties')
            .select('*')
            .eq('id', id)
            .single()
      );

      if (!property) {
        throw new NotFoundException('Propriété non trouvée');
      }

      return property;
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      logger.error('Get property error', { error: error.message, id });
      throw new BusinessRuleException('Erreur lors de la récupération de la propriété', error);
    }
  }

  /**
   * Get properties by owner ID
   */
  async getPropertiesByOwner(ownerId: string): Promise<Property[]> {
    try {
      const properties = await this.executeQuery<Property[]>(
        async () =>
          await this.client
            .from('properties')
            .select('*')
            .eq('owner_id', ownerId)
            .order('created_at', { ascending: false })
      );

      return properties;
    } catch (error: any) {
      logger.error('Get properties by owner error', { error: error.message, ownerId });
      throw new BusinessRuleException('Erreur lors de la récupération des propriétés', error);
    }
  }

  /**
   * Create property
   */
  async createProperty(input: CreatePropertyInput, ownerId: string, imageUrls: string[] = []): Promise<Property> {
    try {
      const property = await this.executeQuery<Property>(
        async () =>
          await this.client
            .from('properties')
            .insert({
              ...input,
              owner_id: ownerId,
              image_urls: imageUrls,
              furnished: input.furnished ?? false,
              amenities: input.amenities || [],
            })
            .select()
            .single()
      );

      // Invalidate cache
      await cacheService.invalidatePropertyCache();

      return property;
    } catch (error: any) {
      logger.error('Create property error', { error: error.message, ownerId });
      throw new BusinessRuleException('Erreur lors de la création de la propriété', error);
    }
  }

  /**
   * Update property
   */
  async updateProperty(id: string, input: UpdatePropertyInput): Promise<Property> {
    try {
      // Check if property exists
      await this.getPropertyById(id);

      const property = await this.executeQuery<Property>(
        async () =>
          await this.client
            .from('properties')
            .update({
              ...input,
              updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single()
      );

      // Invalidate cache
      await cacheService.invalidatePropertyCache(id);

      return property;
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      logger.error('Update property error', { error: error.message, id });
      throw new BusinessRuleException('Erreur lors de la mise à jour de la propriété', error);
    }
  }

  /**
   * Delete property
   */
  async deleteProperty(id: string): Promise<void> {
    try {
      // Get property to delete images
      const property = await this.getPropertyById(id);

      // Delete images from Cloudinary
      if (property.image_urls && property.image_urls.length > 0) {
        const publicIds = property.image_urls
          .map((url) => imageService.extractPublicId(url))
          .filter((id): id is string => id !== null);

        if (publicIds.length > 0) {
          await imageService.deleteImages(publicIds);
        }
      }

      // Delete property
      await this.executeQuery(
        async () =>
          await this.client.from('properties').delete().eq('id', id)
      );

      // Invalidate cache
      await cacheService.invalidatePropertyCache(id);
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      logger.error('Delete property error', { error: error.message, id });
      throw new BusinessRuleException('Erreur lors de la suppression de la propriété', error);
    }
  }
}

export const propertyService = new PropertyService();

