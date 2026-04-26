import { SupabaseService } from './supabase.service';
import { getFirebaseAdmin } from '../config/firebase';
import { logger } from '../utils/logger';

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export class FCMService extends SupabaseService {
  /**
   * Register or refresh a device FCM token for a user.
   * Upserts on (user_id, token) so duplicate registrations are idempotent.
   */
  async registerToken(userId: string, token: string, platform: 'ios' | 'android'): Promise<void> {
    const { error } = await this.client
      .from('fcm_device_tokens')
      .upsert(
        { user_id: userId, token, platform, is_active: true, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,token' }
      );

    if (error) {
      logger.error('FCM: failed to register token', { error: error.message, userId });
    }
  }

  /**
   * Deactivate a device token (on logout or unregister request).
   */
  async removeToken(userId: string, token: string): Promise<void> {
    const { error } = await this.client
      .from('fcm_device_tokens')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('token', token);

    if (error) {
      logger.error('FCM: failed to remove token', { error: error.message, userId });
    }
  }

  /**
   * Deactivate all tokens for a user (full logout).
   */
  async removeAllTokensForUser(userId: string): Promise<void> {
    const { error } = await this.client
      .from('fcm_device_tokens')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (error) {
      logger.error('FCM: failed to remove all tokens for user', { error: error.message, userId });
    }
  }

  /**
   * Send a push notification to all active devices of a user.
   * Silently skips if Firebase is not configured or user has no tokens.
   * Automatically deactivates invalid/expired tokens.
   */
  async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    const firebase = getFirebaseAdmin();
    if (!firebase) return;

    const { data: rows, error } = await this.client
      .from('fcm_device_tokens')
      .select('token')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error || !rows || rows.length === 0) return;

    const tokens = rows.map((r: { token: string }) => r.token);

    const message: any = {
      notification: { title: payload.title, body: payload.body },
      data: payload.data ?? {},
      tokens,
    };

    try {
      const response = await firebase.messaging().sendEachForMulticast(message);

      // Deactivate tokens that are no longer valid
      const invalidTokens: string[] = [];
      response.responses.forEach((r, i) => {
        if (!r.success) {
          const code = r.error?.code;
          if (
            code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-registration-token'
          ) {
            invalidTokens.push(tokens[i]);
          }
        }
      });

      if (invalidTokens.length > 0) {
        await this.client
          .from('fcm_device_tokens')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .in('token', invalidTokens);
      }

      logger.debug('FCM: sent notifications', {
        userId,
        total: tokens.length,
        success: response.successCount,
        failure: response.failureCount,
      });
    } catch (err: any) {
      logger.error('FCM: sendEachForMulticast failed', { error: err.message, userId });
    }
  }
}

export const fcmService = new FCMService();
