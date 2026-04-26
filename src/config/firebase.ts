import * as admin from 'firebase-admin';
import { logger } from '../utils/logger';

let initialized = false;

export function initFirebase(): void {
  if (initialized) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    logger.warn('Firebase Admin SDK not configured — push notifications disabled');
    return;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
    initialized = true;
    logger.info('Firebase Admin SDK initialized');
  } catch (err: any) {
    logger.error('Firebase Admin SDK initialization failed', { error: err.message });
  }
}

export function getFirebaseAdmin(): typeof admin | null {
  return initialized ? admin : null;
}
