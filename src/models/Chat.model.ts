/**
 * Conversation model interface
 */
export interface Conversation {
  id: string;
  booking_id: string;
  client_id: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
}

/**
 * Message model interface
 */
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  message_type: 'user' | 'system';
  created_at: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
}

/**
 * Conversation creation input
 */
export interface CreateConversationInput {
  booking_id: string;
}

/**
 * Message creation input
 */
export interface CreateMessageInput {
  content: string;
  message_type?: 'user' | 'system';
  file_url?: string;
  file_name?: string;
  file_size?: number;
}

/**
 * Conversation with participants and last message
 */
export interface ConversationWithDetails extends Conversation {
  client?: {
    id: string;
    full_name: string;
    email: string;
  };
  owner?: {
    id: string;
    full_name: string;
    email: string;
  };
  last_message?: Message;
  unread_count?: number;
  property_title?: string;
  booking_start_date?: string;
}

/**
 * Message with sender details
 */
export interface MessageWithSender extends Message {
  sender?: {
    id: string;
    full_name: string;
    email: string;
  };
}

/**
 * Paginated messages response
 */
export interface PaginatedMessages {
  messages: MessageWithSender[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

