-- Add service_duration column to orders (stores seconds)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS service_duration INTEGER DEFAULT NULL;

-- Also add km and employee_name if not present (from previous migrations)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS km INTEGER DEFAULT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS employee_name VARCHAR(255) DEFAULT NULL;
