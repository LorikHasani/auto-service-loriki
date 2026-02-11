-- ============================================
-- MIGRATION: Add km, employee_name to orders + employees table + parts_json
-- Run this in your Supabase SQL Editor
-- ============================================

-- Add km column to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS km INTEGER;

-- Add employee_name column to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS employee_name VARCHAR(255);

-- Add parts_json to order_items (stores individual part details for printing)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS parts_json JSONB;

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on employees
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Employees policies
CREATE POLICY "Enable read access for authenticated users" ON employees
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON employees
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON employees
    FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete for authenticated users" ON employees
    FOR DELETE TO authenticated USING (true);

-- ============================================
-- DONE
-- ============================================
