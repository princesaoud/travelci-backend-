import { SupabaseService } from './supabase.service';
import { ValidationException, BusinessRuleException, InfrastructureException } from '../utils/errors';
import { logger } from '../utils/logger';
import { propertyService } from './property.service';

export interface BlockedDateRow {
  id: string;
  property_id: string;
  blocked_date: string; // YYYY-MM-DD
  created_at: string;
}

/**
 * Service for property availability (owner-defined blocked dates)
 */
export class AvailabilityService extends SupabaseService {
  /**
   * Get all blocked dates for a property
   */
  async getBlockedDates(propertyId: string): Promise<string[]> {
    try {
      const { data, error } = await this.client
        .from('property_blocked_dates')
        .select('blocked_date')
        .eq('property_id', propertyId)
        .order('blocked_date', { ascending: true });

      if (error) {
        throw new InfrastructureException(
          `Erreur lors de la récupération des dates bloquées: ${error.message}`,
          error
        );
      }

      return (data as { blocked_date: string }[]).map((row) => row.blocked_date);
    } catch (error: any) {
      if (error instanceof InfrastructureException) {
        throw error;
      }
      logger.error('Get blocked dates error', { error: error.message, propertyId });
      throw new BusinessRuleException('Erreur lors de la récupération des dates bloquées', error);
    }
  }

  /**
   * Add blocked dates for a property
   */
  async addBlockedDates(propertyId: string, dates: string[]): Promise<string[]> {
    try {
      await propertyService.getPropertyById(propertyId);

      const validDates = dates
        .map((d) => (typeof d === 'string' ? d.trim() : ''))
        .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));

      if (validDates.length === 0) {
        throw new ValidationException('Aucune date valide fournie (format attendu: YYYY-MM-DD)');
      }

      const rows = validDates.map((blocked_date) => ({
        property_id: propertyId,
        blocked_date,
      }));

      const { data, error } = await this.client
        .from('property_blocked_dates')
        .upsert(rows, { onConflict: 'property_id,blocked_date', ignoreDuplicates: true })
        .select('blocked_date');

      if (error) {
        throw new InfrastructureException(
          `Erreur lors de l'ajout des dates bloquées: ${error.message}`,
          error
        );
      }

      return (data as { blocked_date: string }[]).map((r) => r.blocked_date);
    } catch (error: any) {
      if (error instanceof ValidationException || error instanceof InfrastructureException) {
        throw error;
      }
      logger.error('Add blocked dates error', { error: error.message, propertyId });
      throw new BusinessRuleException('Erreur lors de l\'ajout des dates bloquées', error);
    }
  }

  /**
   * Remove blocked dates for a property
   */
  async removeBlockedDates(propertyId: string, dates: string[]): Promise<void> {
    try {
      await propertyService.getPropertyById(propertyId);

      const validDates = dates
        .map((d) => (typeof d === 'string' ? d.trim() : ''))
        .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));

      if (validDates.length === 0) {
        return;
      }

      const { error } = await this.client
        .from('property_blocked_dates')
        .delete()
        .eq('property_id', propertyId)
        .in('blocked_date', validDates);

      if (error) {
        throw new InfrastructureException(
          `Erreur lors de la suppression des dates bloquées: ${error.message}`,
          error
        );
      }
    } catch (error: any) {
      if (error instanceof InfrastructureException) {
        throw error;
      }
      logger.error('Remove blocked dates error', { error: error.message, propertyId });
      throw new BusinessRuleException('Erreur lors de la suppression des dates bloquées', error);
    }
  }

  /**
   * Check if any date in [startDate, endDate) is blocked for the property
   */
  async hasBlockedDatesInRange(propertyId: string, startDate: string, endDate: string): Promise<boolean> {
    try {
      const { data, error } = await this.client
        .from('property_blocked_dates')
        .select('id')
        .eq('property_id', propertyId)
        .gte('blocked_date', startDate)
        .lt('blocked_date', endDate)
        .limit(1);

      if (error) {
        throw new InfrastructureException(
          `Erreur lors de la vérification des dates bloquées: ${error.message}`,
          error
        );
      }

      return data != null && data.length > 0;
    } catch (error: any) {
      if (error instanceof InfrastructureException) {
        throw error;
      }
      logger.error('Has blocked dates in range error', { error: error.message, propertyId });
      throw new BusinessRuleException('Erreur lors de la vérification des dates bloquées', error);
    }
  }
}

export const availabilityService = new AvailabilityService();
