import dotenv from 'dotenv';
import path from 'path';

// Load .env file explicitly
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * Environment variables configuration
 * Defaults to local Supabase if SUPABASE_URL is not set (for local development)
 */
export const env = {
  // Supabase - defaults to local Supabase if not set
  SUPABASE_URL:
    process.env.SUPABASE_URL ||
    (process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:54321' : ''),
  SUPABASE_ANON_KEY:
    process.env.SUPABASE_ANON_KEY ||
    (process.env.NODE_ENV === 'development'
      ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
      : ''),
  SUPABASE_SERVICE_ROLE_KEY:
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    (process.env.NODE_ENV === 'development'
      ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
      : ''),

  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // Server
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // CORS - Comma-separated list of allowed origins
  // For Flutter web: include the Flutter dev server URL (e.g., http://localhost:xxxxx)
  // Mobile apps (iOS/Android) don't need CORS configuration
  // Example: CORS_ORIGIN=http://localhost:3000,http://localhost:8080
  CORS_ORIGIN: process.env.CORS_ORIGIN || '',

  // Rate Limiting - Configurable via environment variables
  RATE_LIMIT_AUTH_MAX: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '20', 10),
  RATE_LIMIT_AUTH_WINDOW_MS: parseInt(
    process.env.RATE_LIMIT_AUTH_WINDOW_MS || '900000',
    10
  ), // 15 minutes default
  RATE_LIMIT_GENERAL_MAX: parseInt(process.env.RATE_LIMIT_GENERAL_MAX || '200', 10),
  RATE_LIMIT_GENERAL_WINDOW_MS: parseInt(
    process.env.RATE_LIMIT_GENERAL_WINDOW_MS || '900000',
    10
  ), // 15 minutes default
};

/**
 * Validate required environment variables
 */
export function validateEnv(): void {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET',
  ];

  const missing: string[] = [];

  required.forEach((key) => {
    if (!env[key as keyof typeof env] || env[key as keyof typeof env] === '') {
      missing.push(key);
    }
  });

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

