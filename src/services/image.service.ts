import sharp from 'sharp';
import { getSupabaseServiceClient } from '../config/supabase';
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
 * Image service for processing and uploading images using Supabase Storage
 */
export class ImageService {
  private readonly sizes: ImageSize[] = [
    { width: 300, height: 300, suffix: 'thumb' },
    { width: 800, height: 600, suffix: 'medium' },
    { width: 1920, height: 1080, suffix: 'large' },
  ];
  private readonly bucketName = 'property-images';

  /**
   * Upload buffer to Supabase Storage
   */
  private async uploadToStorage(
    file: Buffer,
    path: string,
    contentType: string = 'image/webp'
  ): Promise<string> {
    try {
      const supabase = getSupabaseServiceClient();

      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(path, file, {
          contentType,
          upsert: true,
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(data.path);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL from Supabase Storage');
      }

      return urlData.publicUrl;
    } catch (error: any) {
      logger.error('Supabase Storage upload error', {
        error: error.message,
        path,
      });
      throw new InfrastructureException(
        `Erreur lors du téléchargement vers Supabase Storage: ${error.message}`,
        error
      );
    }
  }

  /**
   * Upload and optimize image with multiple sizes
   */
  async uploadAndOptimize(file: Buffer, propertyId: string): Promise<OptimizedImages> {
    try {
      const timestamp = Date.now();
      const optimizedImages = await Promise.all(
        this.sizes.map(async ({ width, height, suffix }) => {
          // Optimize image with Sharp
          const optimized = await sharp(file)
            .resize(width, height, { fit: 'cover', withoutEnlargement: true })
            .webp({ quality: 85 })
            .toBuffer();

          // Upload to Supabase Storage
          const path = `properties/${propertyId}/${timestamp}-${suffix}.webp`;
          const url = await this.uploadToStorage(optimized, path, 'image/webp');

          return url;
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
      // Optimize image with Sharp
      const optimized = await sharp(file)
        .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();

      // Generate path
      const timestamp = Date.now();
      const filename = publicId || `${timestamp}.webp`;
      const path = `${folder}/${filename}`;

      // Upload to Supabase Storage
      return await this.uploadToStorage(optimized, path, 'image/webp');
    } catch (error: any) {
      logger.error('Single image upload error', { error: error.message, folder });
      throw new InfrastructureException(
        `Erreur lors du téléchargement de l'image: ${error.message}`,
        error
      );
    }
  }

  /**
   * Get optimized URL - returns original URL (images are pre-optimized)
   * This method is kept for backward compatibility but doesn't do transformation
   */
  getOptimizedUrl(
    originalUrl: string,
    _width?: number,
    _height?: number,
    _format?: string
  ): string {
    // Since we pre-optimize images with Sharp, we just return the original URL
    // If you need dynamic resizing, you could use Supabase Storage image transformations
    // or serve different pre-generated sizes
    return originalUrl;
  }

  /**
   * Delete image from Supabase Storage
   */
  async deleteImage(url: string): Promise<void> {
    try {
      const supabase = getSupabaseServiceClient();

      // Extract path from URL
      const path = this.extractPathFromUrl(url);
      if (!path) {
        throw new Error('Invalid URL format');
      }

      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([path]);

      if (error) {
        throw error;
      }
    } catch (error: any) {
      logger.error('Image deletion error', { error: error.message, url });
      throw new InfrastructureException(
        `Erreur lors de la suppression de l'image: ${error.message}`,
        error
      );
    }
  }

  /**
   * Delete multiple images from Supabase Storage
   */
  async deleteImages(urls: string[]): Promise<void> {
    try {
      const supabase = getSupabaseServiceClient();

      // Extract paths from URLs
      const paths = urls
        .map((url) => this.extractPathFromUrl(url))
        .filter((path): path is string => path !== null);

      if (paths.length === 0) {
        return;
      }

      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove(paths);

      if (error) {
        throw error;
      }
    } catch (error: any) {
      logger.error('Bulk image deletion error', {
        error: error.message,
        count: urls.length,
      });
      throw new InfrastructureException(
        `Erreur lors de la suppression des images: ${error.message}`,
        error
      );
    }
  }

  /**
   * Extract path from Supabase Storage URL
   */
  private extractPathFromUrl(url: string): string | null {
    try {
      // Supabase Storage URL format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
      const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }
}

export const imageService = new ImageService();
