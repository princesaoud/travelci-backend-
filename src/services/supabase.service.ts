import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseServiceClient } from '../config/supabase';
import { InfrastructureException } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Base Supabase service with error handling
 */
export class SupabaseService {
  protected client: SupabaseClient;

  constructor() {
    this.client = getSupabaseServiceClient();
  }

  /**
   * Execute a database operation with error handling
   */
  protected async executeQuery<T>(
    operation: () => Promise<{ data: T | null; error: any }>
  ): Promise<T> {
    try {
      const { data, error } = await operation();

      if (error) {
        logger.error('Supabase query error', { 
          error: error.message, 
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        
        // Provide more specific error messages for common issues
        if (error.code === 'PGRST116') {
          throw new InfrastructureException(
            'Erreur: Aucune donnée retournée. Vérifiez que la table existe et que les migrations ont été exécutées.',
            error
          );
        }
        
        throw new InfrastructureException(
          `Erreur lors de l'exécution de la requête: ${error.message}${error.hint ? ` (${error.hint})` : ''}`,
          error
        );
      }

      if (data === null) {
        throw new InfrastructureException('Aucune donnée retournée par la requête. La table existe-t-elle ?');
      }

      return data;
    } catch (error: any) {
      if (error instanceof InfrastructureException) {
        throw error;
      }
      logger.error('Unexpected error in Supabase service', { error: error.message });
      throw new InfrastructureException('Erreur inattendue lors de l\'accès à la base de données', error);
    }
  }

  /**
   * Execute a database operation that may return null
   */
  protected async executeQueryNullable<T>(
    operation: () => Promise<{ data: T | null; error: any }>
  ): Promise<T | null> {
    try {
      const { data, error } = await operation();

      if (error) {
        logger.error('Supabase query error', { error: error.message, code: error.code });
        throw new InfrastructureException(
          `Erreur lors de l'exécution de la requête: ${error.message}`,
          error
        );
      }

      return data;
    } catch (error: any) {
      if (error instanceof InfrastructureException) {
        throw error;
      }
      logger.error('Unexpected error in Supabase service', { error: error.message });
      throw new InfrastructureException('Erreur inattendue lors de l\'accès à la base de données', error);
    }
  }
}

