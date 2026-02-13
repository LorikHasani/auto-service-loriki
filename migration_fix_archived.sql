-- IMPORTANT: Run this to fix past orders with NULL is_archived
-- This ensures all existing orders have is_archived = FALSE (not NULL)
-- After this, the auto-archive feature will work correctly

UPDATE orders SET is_archived = FALSE WHERE is_archived IS NULL;

-- Set default for future inserts
ALTER TABLE orders ALTER COLUMN is_archived SET DEFAULT FALSE;
