/**
 * User model interface
 */
export interface User {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  password_hash?: string;
  role: 'client' | 'owner' | 'admin';
  is_verified: boolean;
  national_id_front_url?: string;
  national_id_back_url?: string;
  created_at: string;
  updated_at: string;
}

/**
 * User creation input (without password_hash)
 */
export interface CreateUserInput {
  full_name: string;
  email: string;
  phone?: string;
  password: string;
  role?: 'client' | 'owner' | 'admin';
  national_id_front_url?: string;
  national_id_back_url?: string;
}

/**
 * User update input
 */
export interface UpdateUserInput {
  full_name?: string;
  phone?: string;
  is_verified?: boolean;
  national_id_front_url?: string;
  national_id_back_url?: string;
}

/**
 * User response (without sensitive data)
 */
export interface UserResponse {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: 'client' | 'owner' | 'admin';
  is_verified: boolean;
  national_id_front_url?: string;
  national_id_back_url?: string;
  created_at: string;
  updated_at: string;
}

