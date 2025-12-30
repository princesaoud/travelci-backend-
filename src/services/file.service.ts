import { getSupabaseServiceClient } from '../config/supabase';
import { logger } from '../utils/logger';
import { InfrastructureException } from '../utils/errors';

/**
 * File service for uploading files to Supabase Storage
 */
export class FileService {
  private readonly bucketName = 'message-files';

  /**
   * Upload file to Supabase Storage
   */
  async uploadFile(
    file: Buffer,
    fileName: string,
    contentType: string,
    conversationId: string,
    messageId: string
  ): Promise<string> {
    try {
      const supabase = getSupabaseServiceClient();

      // Check if bucket exists, if not, try to create it
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      if (listError) {
        logger.warn('Error listing buckets', { error: listError.message });
      } else {
        const bucketExists = buckets?.some((bucket) => bucket.id === this.bucketName);
        if (!bucketExists) {
          logger.warn(`Bucket ${this.bucketName} does not exist, attempting to create it`);
          // Try to create the bucket
          const { error: createError } = await supabase.storage.createBucket(this.bucketName, {
            public: true,
            fileSizeLimit: 20971520, // 20MB
            allowedMimeTypes: null, // Allow all file types
          });
          if (createError) {
            logger.error('Failed to create bucket', { error: createError.message });
            throw new InfrastructureException(
              `Le bucket de stockage n'existe pas. Veuillez exécuter la migration 009_create_message_files_bucket.sql dans Supabase.`,
              createError
            );
          }
          logger.info(`Bucket ${this.bucketName} created successfully`);
        }
      }

      // Generate unique file path
      const timestamp = Date.now();
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const path = `conversations/${conversationId}/${messageId}-${timestamp}-${sanitizedFileName}`;

      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(path, file, {
          contentType,
          upsert: false,
        });

      if (error) {
        // Provide more helpful error message for bucket not found
        if (error.message?.includes('Bucket not found') || error.message?.includes('not found')) {
          throw new InfrastructureException(
            `Le bucket de stockage '${this.bucketName}' n'existe pas. Veuillez exécuter la migration 009_create_message_files_bucket.sql dans le dashboard Supabase.`,
            error
          );
        }
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
      logger.error('File upload error', {
        error: error.message,
        fileName,
        conversationId,
      });
      throw new InfrastructureException(
        `Erreur lors du téléchargement du fichier: ${error.message}`,
        error
      );
    }
  }

  /**
   * Delete file from Supabase Storage
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const supabase = getSupabaseServiceClient();

      // Extract path from URL
      const url = new URL(fileUrl);
      const pathParts = url.pathname.split('/');
      const bucketIndex = pathParts.findIndex((part) => part === this.bucketName);
      
      if (bucketIndex === -1) {
        throw new Error('Invalid file URL');
      }

      const filePath = pathParts.slice(bucketIndex + 1).join('/');

      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        throw error;
      }
    } catch (error: any) {
      logger.error('File deletion error', {
        error: error.message,
        fileUrl,
      });
      // Don't throw - file deletion is not critical
    }
  }
}

export const fileService = new FileService();

