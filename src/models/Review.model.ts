export interface Review {
  id: string;
  property_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateReviewInput {
  rating: number;
  comment: string;
}
