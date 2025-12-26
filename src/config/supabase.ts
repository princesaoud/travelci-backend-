import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';
import { logger } from '../utils/logger';
import { InfrastructureException } from '../utils/errors';

/**
 * Supabase client instance
 * Cache cleared on each initialization to avoid stale schema cache issues
 */
let supabaseClient: SupabaseClient | null = null;
let supabaseServiceClient: SupabaseClient | null = null;

/**
 * Clear Supabase client cache (useful for development)
 */
export function clearSupabaseClients(): void {
  supabaseClient = null;
  supabaseServiceClient = null;
}

/**
 * Initialize Supabase client (anon key - for public operations)
 */
export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  try {
    supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
      },
    });
    return supabaseClient;
  } catch (error: any) {
    logger.error('Failed to initialize Supabase client', { error: error.message });
    throw new InfrastructureException('Échec de l\'initialisation de Supabase', error);
  }
}

/**
 * Initialize Supabase service client (service role key - for admin operations)
 */
export function getSupabaseServiceClient(): SupabaseClient {
  if (supabaseServiceClient) {
    return supabaseServiceClient;
  }

  try {
    supabaseServiceClient = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        db: {
          schema: 'public',
        },
        global: {
          headers: {
            'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
          },
        },
      }
    );
    return supabaseServiceClient;
  } catch (error: any) {
    logger.error('Failed to initialize Supabase service client', {
      error: error.message,
    });
    throw new InfrastructureException(
      'Échec de l\'initialisation du client Supabase service',
      error
    );
  }
}

