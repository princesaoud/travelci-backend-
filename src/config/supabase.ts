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

  // Validate environment variables
  if (!env.SUPABASE_URL || env.SUPABASE_URL.trim() === '') {
    const error = new Error('SUPABASE_URL is empty or not set');
    logger.error('Failed to initialize Supabase client - URL validation', {
      error: error.message,
    });
    throw new InfrastructureException(
      'Échec de l\'initialisation de Supabase: SUPABASE_URL est vide ou non définie',
      error
    );
  }

  if (!env.SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY.trim() === '') {
    const error = new Error('SUPABASE_ANON_KEY is empty or not set');
    logger.error('Failed to initialize Supabase client - Key validation', {
      error: error.message,
    });
    throw new InfrastructureException(
      'Échec de l\'initialisation de Supabase: SUPABASE_ANON_KEY est vide ou non définie',
      error
    );
  }

  try {
    supabaseClient = createClient(env.SUPABASE_URL.trim(), env.SUPABASE_ANON_KEY.trim(), {
      auth: {
        persistSession: false,
      },
    });
    return supabaseClient;
  } catch (error: any) {
    logger.error('Failed to initialize Supabase client - createClient error', {
      error: error.message,
      errorName: error.name,
      urlLength: env.SUPABASE_URL?.length || 0,
      keyLength: env.SUPABASE_ANON_KEY?.length || 0,
    });
    throw new InfrastructureException(
      `Échec de l'initialisation de Supabase: ${error.message}`,
      error
    );
  }
}

/**
 * Initialize Supabase service client (service role key - for admin operations)
 */
export function getSupabaseServiceClient(): SupabaseClient {
  if (supabaseServiceClient) {
    return supabaseServiceClient;
  }

  // Validate environment variables before attempting to create client
  if (!env.SUPABASE_URL || env.SUPABASE_URL.trim() === '') {
    const error = new Error('SUPABASE_URL is empty or not set');
    logger.error('Failed to initialize Supabase service client - URL validation', {
      error: error.message,
      hasUrl: !!env.SUPABASE_URL,
      urlLength: env.SUPABASE_URL?.length || 0,
      urlPrefix: env.SUPABASE_URL?.substring(0, 10) || 'N/A',
    });
    throw new InfrastructureException(
      'Échec de l\'initialisation du client Supabase service: SUPABASE_URL est vide ou non définie',
      error
    );
  }

  if (!env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY.trim() === '') {
    const error = new Error('SUPABASE_SERVICE_ROLE_KEY is empty or not set');
    logger.error('Failed to initialize Supabase service client - Key validation', {
      error: error.message,
      hasKey: !!env.SUPABASE_SERVICE_ROLE_KEY,
      keyLength: env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
      keyPrefix: env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10) || 'N/A',
    });
    throw new InfrastructureException(
      'Échec de l\'initialisation du client Supabase service: SUPABASE_SERVICE_ROLE_KEY est vide ou non définie',
      error
    );
  }

  // Validate URL format
  try {
    new URL(env.SUPABASE_URL);
  } catch (urlError: any) {
    logger.error('Failed to initialize Supabase service client - Invalid URL format', {
      error: urlError.message,
      url: env.SUPABASE_URL.substring(0, 50) + '...', // Log partial URL for debugging
    });
    throw new InfrastructureException(
      `Échec de l'initialisation du client Supabase service: Format d'URL invalide - ${urlError.message}`,
      urlError
    );
  }

  try {
    logger.info('Initializing Supabase service client', {
      urlLength: env.SUPABASE_URL.length,
      urlPrefix: env.SUPABASE_URL.substring(0, 20) + '...',
      keyLength: env.SUPABASE_SERVICE_ROLE_KEY.length,
      keyPrefix: env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10) + '...',
    });

    supabaseServiceClient = createClient(
      env.SUPABASE_URL.trim(),
      env.SUPABASE_SERVICE_ROLE_KEY.trim(),
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
            'apikey': env.SUPABASE_SERVICE_ROLE_KEY.trim(),
          },
        },
      }
    );
    
    logger.info('Supabase service client initialized successfully');
    return supabaseServiceClient;
  } catch (error: any) {
    logger.error('Failed to initialize Supabase service client - createClient error', {
      error: error.message,
      errorName: error.name,
      errorStack: error.stack,
      urlLength: env.SUPABASE_URL?.length || 0,
      keyLength: env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
    });
    throw new InfrastructureException(
      `Échec de l'initialisation du client Supabase service: ${error.message}`,
      error
    );
  }
}

