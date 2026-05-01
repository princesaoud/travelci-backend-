import { SupabaseService } from './supabase.service';
import { Review, CreateReviewInput } from '../models/Review.model';
import { NotFoundException, ValidationException, BusinessRuleException } from '../utils/errors';
import { logger } from '../utils/logger';

export class ReviewService extends SupabaseService {
  /**
   * Get all reviews for a property, ordered by most recent
   */
  async getReviews(propertyId: string): Promise<Review[]> {
    try {
      const { data, error } = await this.client
        .from('reviews')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new BusinessRuleException(`Erreur lors de la récupération des avis: ${error.message}`);
      }

      return (data as Review[]) || [];
    } catch (error: any) {
      if (error instanceof BusinessRuleException) throw error;
      logger.error('Get reviews error', { error: error.message, propertyId });
      throw new BusinessRuleException('Erreur lors de la récupération des avis', error);
    }
  }

  /**
   * Create a review — one review per user per property enforced by DB UNIQUE constraint
   */
  async createReview(
    propertyId: string,
    userId: string,
    userName: string,
    input: CreateReviewInput
  ): Promise<Review> {
    try {
      if (input.rating < 1 || input.rating > 5) {
        throw new ValidationException('La note doit être comprise entre 1 et 5');
      }

      if (!input.comment.trim()) {
        throw new ValidationException('Le commentaire ne peut pas être vide');
      }

      const review = await this.executeQuery<Review>(
        async () =>
          await this.client
            .from('reviews')
            .insert({
              property_id: propertyId,
              user_id: userId,
              user_name: userName,
              rating: input.rating,
              comment: input.comment.trim(),
            })
            .select()
            .single()
      );

      return review;
    } catch (error: any) {
      if (error instanceof ValidationException) throw error;
      // Unique constraint violation — user already reviewed this property
      if (error?.message?.includes('duplicate') || error?.code === '23505') {
        throw new ValidationException('Vous avez déjà publié un avis pour ce logement');
      }
      logger.error('Create review error', { error: error.message, propertyId, userId });
      throw new BusinessRuleException('Erreur lors de la création de l\'avis', error);
    }
  }

  /**
   * Delete a review (owner of review or admin only)
   */
  async deleteReview(reviewId: string, userId: string, userRole: string): Promise<void> {
    try {
      const { data: review, error: fetchError } = await this.client
        .from('reviews')
        .select('user_id')
        .eq('id', reviewId)
        .maybeSingle();

      if (fetchError || !review) {
        throw new NotFoundException('Avis non trouvé');
      }

      if (userRole !== 'admin' && review.user_id !== userId) {
        throw new ValidationException('Vous n\'êtes pas autorisé à supprimer cet avis');
      }

      const { error } = await this.client
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) {
        throw new BusinessRuleException(`Erreur lors de la suppression de l'avis: ${error.message}`);
      }
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof ValidationException || error instanceof BusinessRuleException) {
        throw error;
      }
      logger.error('Delete review error', { error: error.message, reviewId });
      throw new BusinessRuleException('Erreur lors de la suppression de l\'avis', error);
    }
  }

  /**
   * Get average rating for a property
   */
  async getAverageRating(propertyId: string): Promise<{ average: number; count: number }> {
    const reviews = await this.getReviews(propertyId);
    if (reviews.length === 0) return { average: 0, count: 0 };
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return { average: Math.round((sum / reviews.length) * 10) / 10, count: reviews.length };
  }
}

export const reviewService = new ReviewService();
