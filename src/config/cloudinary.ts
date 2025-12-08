import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';
import { logger } from '../utils/logger';
import { InfrastructureException } from '../utils/errors';

/**
 * Initialize Cloudinary configuration
 */
export function initCloudinary(): void {
  try {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    logger.info('Cloudinary configured successfully');
  } catch (error: any) {
    logger.error('Failed to configure Cloudinary', { error: error.message });
    throw new InfrastructureException('Échec de la configuration de Cloudinary', error);
  }
}

export { cloudinary };

