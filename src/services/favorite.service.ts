import { SupabaseService } from './supabase.service';
import { BusinessRuleException } from '../utils/errors';
import { logger } from '../utils/logger';

export class FavoriteService extends SupabaseService {
  /**
   * Get all favorite property IDs for a user
   */
  async getFavorites(userId: string): Promise<string[]> {
    try {
      const { data, error } = await this.client
        .from('favorites')
        .select('property_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new BusinessRuleException(`Erreur lors de la récupération des favoris: ${error.message}`);
      }

      return (data || []).map((row: { property_id: string }) => row.property_id);
    } catch (error: any) {
      if (error instanceof BusinessRuleException) throw error;
      logger.error('Get favorites error', { error: error.message, userId });
      throw new BusinessRuleException('Erreur lors de la récupération des favoris', error);
    }
  }

  /**
   * Add a property to user favorites (idempotent — no error if already exists)
   */
  async addFavorite(userId: string, propertyId: string): Promise<void> {
    try {
      const { error } = await this.client
        .from('favorites')
        .upsert({ user_id: userId, property_id: propertyId }, { onConflict: 'user_id,property_id' });

      if (error) {
        throw new BusinessRuleException(`Erreur lors de l'ajout au favoris: ${error.message}`);
      }
    } catch (error: any) {
      if (error instanceof BusinessRuleException) throw error;
      logger.error('Add favorite error', { error: error.message, userId, propertyId });
      throw new BusinessRuleException('Erreur lors de l\'ajout au favoris', error);
    }
  }

  /**
   * Remove a property from user favorites
   */
  async removeFavorite(userId: string, propertyId: string): Promise<void> {
    try {
      const { error } = await this.client
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('property_id', propertyId);

      if (error) {
        throw new BusinessRuleException(`Erreur lors de la suppression du favori: ${error.message}`);
      }
    } catch (error: any) {
      if (error instanceof BusinessRuleException) throw error;
      logger.error('Remove favorite error', { error: error.message, userId, propertyId });
      throw new BusinessRuleException('Erreur lors de la suppression du favori', error);
    }
  }

  /**
   * Check if a property is favorited by a user
   */
  async isFavorite(userId: string, propertyId: string): Promise<boolean> {
    try {
      const { data, error } = await this.client
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('property_id', propertyId)
        .maybeSingle();

      if (error) {
        throw new BusinessRuleException(`Erreur lors de la vérification du favori: ${error.message}`);
      }

      return data !== null;
    } catch (error: any) {
      if (error instanceof BusinessRuleException) throw error;
      logger.error('Check favorite error', { error: error.message, userId, propertyId });
      throw new BusinessRuleException('Erreur lors de la vérification du favori', error);
    }
  }
}

export const favoriteService = new FavoriteService();
