/**
 * Vercel serverless function entry point
 * This file exports the Express app for Vercel's serverless runtime
 * 
 * IMPORTANT: Set VERCEL env var BEFORE importing app to ensure proper initialization
 */
process.env.VERCEL = '1';

// Wrap app import in try-catch to handle initialization errors gracefully
let app: any;
let initError: Error | null = null;

try {
  app = require('../src/app').default;
} catch (error: any) {
  // Store initialization error to handle it in the handler
  initError = error;
  
  // Log full error details for debugging
  console.error('=== APP INITIALIZATION FAILED ===');
  console.error('Error Message:', error.message);
  console.error('Error Name:', error.name);
  console.error('Error Code:', error.code);
  console.error('Error Stack:', error.stack);
  console.error('NODE_ENV:', process.env.NODE_ENV);
  console.error('VERCEL:', process.env.VERCEL);
  console.error('Available env vars:', Object.keys(process.env).filter(k => 
    k.includes('SUPABASE') || k.includes('JWT') || k === 'NODE_ENV'
  ));
  console.error('==================================');
  
  // Create a minimal Express app to handle errors gracefully
  const express = require('express');
  app = express();
  
  // Parse JSON for error responses
  app.use(express.json());
  
  // Return error response for all routes
  app.use('*', (_req: any, res: any) => {
    console.error('Request received but app not initialized:', initError?.message);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erreur d\'initialisation du serveur. Vérifiez les variables d\'environnement.',
        code: 'INIT_ERROR',
        // Include error details even in production for debugging Vercel issues
        details: initError?.message || 'Unknown initialization error',
        errorType: initError?.name,
        statusCode: 500,
      },
    });
  });
}

export default app;

