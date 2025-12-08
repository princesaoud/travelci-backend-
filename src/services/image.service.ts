import sharp from 'sharp';
import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../utils/logger';
import { InfrastructureException } from '../utils/errors';

/**
 * Image size configuration
 */
interface ImageSize {
  width: number;
  height: number;
  suffix: string;
}

/**
 * Optimized image URLs
 */
export interface OptimizedImages {
  thumbnail: string;
  medium: string;
  large: string;
}

/**
 * Image service for processing and uploading images
 */
export class ImageService {
  private readonly sizes: ImageSize[] = [
    { width: 300, height: 300, suffix: 'thumb' },
    { width: 800, height: 600, suffix: 'medium' },
    { width: 1920, height: 1080, suffix: 'large' },
  ];

  /**
   * Upload and optimize image with multiple sizes
   */
  async uploadAndOptimize(file: Buffer, propertyId: string): Promise<OptimizedImages> {
    try {
      const optimizedImages = await Promise.all(
        this.sizes.map(async ({ width, height, suffix }) => {
          const optimized = await sharp(file)
            .resize(width, height, { fit: 'cover', withoutEnlargement: true })
            .webp({ quality: 85 })
            .toBuffer();

          return new Promise<string>((resolve, reject) => {
            cloudinary.uploader
              .upload_stream(
                {
                  folder: `properties/${propertyId}`,
                  public_id: suffix,
                  format: 'webp',
                  transformation: [
                    { width, height, crop: 'fill' },
                    { quality: 'auto' },
                    { fetch_format: 'auto' },
                  ],
                },
                (error, result) => {
                  if (error) {
                    reject(error);
                  } else if (result) {
                    resolve(result.secure_url);
                  } else {
                    reject(new Error('No result from Cloudinary'));
                  }
                }
              )
              .end(optimized);
          });
        })
      );

      return {
        thumbnail: optimizedImages[0],
        medium: optimizedImages[1],
        large: optimizedImages[2],
      };
    } catch (error: any) {
      logger.error('Image upload error', { error: error.message, propertyId });
      throw new InfrastructureException(
        `Erreur lors du téléchargement de l'image: ${error.message}`,
        error
      );
    }
  }

  /**
   * Upload single image with optimization
   */
  async uploadSingle(file: Buffer, folder: string, publicId?: string): Promise<string> {
    try {
      const optimized = await sharp(file)
        .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();

      return new Promise<string>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder,
              public_id: publicId,
              format: 'webp',
              transformation: [
                { quality: 'auto' },
                { fetch_format: 'auto' },
              ],
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else if (result) {
                resolve(result.secure_url);
              } else {
                reject(new Error('No result from Cloudinary'));
              }
            }
          )
          .end(optimized);
      });
    } catch (error: any) {
      logger.error('Single image upload error', { error: error.message, folder });
      throw new InfrastructureException(
        `Erreur lors du téléchargement de l'image: ${error.message}`,
        error
      );
    }
  }

  /**
   * Get optimized URL from Cloudinary
   */
  getOptimizedUrl(
    originalUrl: string,
    width?: number,
    height?: number,
    format?: string
  ): string {
    try {
      return cloudinary.url(originalUrl, {
        width: width || 800,
        height: height || 600,
        crop: 'fill',
        quality: 'auto',
        format: format || 'auto',
      });
    } catch (error: any) {
      logger.error('URL optimization error', { error: error.message, originalUrl });
      // Return original URL if optimization fails
      return originalUrl;
    }
  }

  /**
   * Delete image from Cloudinary
   */
  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error: any) {
      logger.error('Image deletion error', { error: error.message, publicId });
      throw new InfrastructureException(
        `Erreur lors de la suppression de l'image: ${error.message}`,
        error
      );
    }
  }

  /**
   * Delete multiple images from Cloudinary
   */
  async deleteImages(publicIds: string[]): Promise<void> {
    try {
      await cloudinary.api.delete_resources(publicIds);
    } catch (error: any) {
      logger.error('Bulk image deletion error', { error: error.message, count: publicIds.length });
      throw new InfrastructureException(
        `Erreur lors de la suppression des images: ${error.message}`,
        error
      );
    }
  }

  /**
   * Extract public ID from Cloudinary URL
   */
  extractPublicId(url: string): string | null {
    try {
      const matches = url.match(/\/v\d+\/(.+)\.(jpg|jpeg|png|webp|gif)/i);
      return matches ? matches[1] : null;
    } catch {
      return null;
    }
  }
}

export const imageService = new ImageService();

