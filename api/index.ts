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
  console.error('Failed to initialize app:', error.message, error.stack);
  
  // Create a minimal Express app to handle errors gracefully
  const express = require('express');
  app = express();
  
  // Return error response for all routes
  app.use('*', (req: any, res: any) => {
    console.error('App initialization error:', initError?.message);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erreur d\'initialisation du serveur. Vérifiez les variables d\'environnement.',
        code: 'INIT_ERROR',
        details: process.env.NODE_ENV === 'production' 
          ? undefined 
          : initError?.message,
        statusCode: 500,
      },
    });
  });
}

export default app;

