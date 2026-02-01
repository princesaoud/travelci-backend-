/**
 * Property model interface
 */
export interface Property {
  id: string;
  owner_id: string;
  title: string;
  description?: string;
  type: 'apartment' | 'villa';
  furnished: boolean;
  price_per_night: number;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  room_count?: number; // 1=studio, 2=2 pièces, etc.
  image_urls: string[];
  amenities: string[];
  created_at: string;
  updated_at: string;
}

/**
 * Property creation input
 */
export interface CreatePropertyInput {
  title: string;
  description?: string;
  type: 'apartment' | 'villa';
  furnished?: boolean;
  price_per_night: number;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  amenities?: string[];
}

/**
 * Property update input
 */
export interface UpdatePropertyInput {
  title?: string;
  description?: string;
  type?: 'apartment' | 'villa';
  furnished?: boolean;
  price_per_night?: number;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  room_count?: number;
  image_urls?: string[];
  amenities?: string[];
}

/**
 * Property search filters
 */
export interface PropertyFilters {
  city?: string;
  type?: 'apartment' | 'villa';
  furnished?: boolean;
  priceMin?: number;
  priceMax?: number;
  page?: number;
  limit?: number;
}

