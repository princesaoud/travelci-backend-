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

