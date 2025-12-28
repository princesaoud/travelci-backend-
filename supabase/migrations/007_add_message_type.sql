-- Add message_type column to messages table
-- This allows distinguishing between user messages and system messages (booking status updates, etc.)
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'user' CHECK (message_type IN ('user', 'system'));

-- Add index for message_type queries
CREATE INDEX IF NOT EXISTS idx_messages_message_type ON messages(message_type);

-- Update existing messages to have 'user' type (default value will handle new ones, but explicit for clarity)
UPDATE messages SET message_type = 'user' WHERE message_type IS NULL;

-- Comments
COMMENT ON COLUMN messages.message_type IS 'Type of message: user (regular message) or system (automatic notification like booking status update)';

