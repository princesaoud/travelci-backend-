/**
 * Booking model interface
 */
export interface Booking {
  id: string;
  property_id: string;
  client_id: string;
  start_date: string;
  end_date: string;
  nights: number;
  guests: number;
  message?: string;
  total_price: number;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  created_at: string;
  updated_at: string;
}

/**
 * Booking creation input
 */
export interface CreateBookingInput {
  property_id: string;
  start_date: string;
  end_date: string;
  guests: number;
  message?: string;
}

/**
 * Booking status update input
 */
export interface UpdateBookingStatusInput {
  status: 'accepted' | 'declined' | 'cancelled';
}

/**
 * Booking with property details
 */
export interface BookingWithProperty extends Booking {
  property?: {
    id: string;
    title: string;
    city: string;
    image_urls: string[];
  };
}

