-- AutoService Pro - Supabase Database Schema
-- Run this script in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CLIENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster searches
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_name ON clients(full_name);

-- ============================================
-- CARS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS cars (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    color VARCHAR(50),
    license_plate VARCHAR(50) NOT NULL,
    vin VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_cars_client_id ON cars(client_id);
CREATE INDEX idx_cars_license_plate ON cars(license_plate);

-- ============================================
-- SERVICES TABLE (Predefined services catalog)
-- ============================================
CREATE TABLE IF NOT EXISTS services (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    default_price DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_services_name ON services(name);

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    car_id BIGINT NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
    is_paid BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_orders_client_id ON orders(client_id);
CREATE INDEX idx_orders_car_id ON orders(car_id);
CREATE INDEX idx_orders_is_paid ON orders(is_paid);
CREATE INDEX idx_orders_is_archived ON orders(is_archived);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- ============================================
-- ORDER ITEMS TABLE (Services in an order)
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    service_name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity DECIMAL(10, 2) DEFAULT 1,
    unit_price DECIMAL(10, 2) DEFAULT 0,
    labor_cost DECIMAL(10, 2) DEFAULT 0,
    parts_cost DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- ============================================
-- DAILY LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS daily_logs (
    id BIGSERIAL PRIMARY KEY,
    log_date DATE NOT NULL,
    description TEXT NOT NULL,
    staff_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_daily_logs_date ON daily_logs(log_date DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

-- Clients policies
CREATE POLICY "Enable read access for authenticated users" ON clients
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON clients
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON clients
    FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Enable delete for authenticated users" ON clients
    FOR DELETE
    TO authenticated
    USING (true);

-- Cars policies
CREATE POLICY "Enable read access for authenticated users" ON cars
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON cars
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON cars
    FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Enable delete for authenticated users" ON cars
    FOR DELETE
    TO authenticated
    USING (true);

-- Orders policies
CREATE POLICY "Enable read access for authenticated users" ON orders
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON orders
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON orders
    FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Enable delete for authenticated users" ON orders
    FOR DELETE
    TO authenticated
    USING (true);

-- Daily Logs policies
CREATE POLICY "Enable read access for authenticated users" ON daily_logs
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON daily_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON daily_logs
    FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Enable delete for authenticated users" ON daily_logs
    FOR DELETE
    TO authenticated
    USING (true);

-- Order Items policies
CREATE POLICY "Enable read access for authenticated users" ON order_items
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON order_items
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON order_items
    FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Enable delete for authenticated users" ON order_items
    FOR DELETE
    TO authenticated
    USING (true);

-- Services policies
CREATE POLICY "Enable read access for authenticated users" ON services
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON services
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON services
    FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Enable delete for authenticated users" ON services
    FOR DELETE
    TO authenticated
    USING (true);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cars_updated_at BEFORE UPDATE ON cars
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- AUTOMATIC ARCHIVING FUNCTION
-- ============================================

-- Function to archive orders older than 1 day
CREATE OR REPLACE FUNCTION archive_old_orders()
RETURNS void AS $$
BEGIN
    UPDATE orders
    SET is_archived = true,
        archived_at = NOW()
    WHERE is_archived = false
    AND created_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- You can run this function manually or set up a cron job
-- To manually archive: SELECT archive_old_orders();

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert sample clients
INSERT INTO clients (full_name, phone, email, address) VALUES
    ('John Smith', '555-0101', 'john.smith@email.com', '123 Main St, City, State'),
    ('Sarah Johnson', '555-0102', 'sarah.j@email.com', '456 Oak Ave, City, State'),
    ('Michael Brown', '555-0103', 'mbrown@email.com', '789 Pine Rd, City, State');

-- Insert sample cars
INSERT INTO cars (client_id, make, model, year, color, license_plate, vin) VALUES
    (1, 'Toyota', 'Camry', 2020, 'Silver', 'ABC-1234', '1HGBH41JXMN109186'),
    (1, 'Honda', 'Civic', 2018, 'Blue', 'XYZ-5678', '2HGFC1F59LH123456'),
    (2, 'Ford', 'F-150', 2021, 'Red', 'DEF-9012', '1FTFW1E53LKE12345'),
    (3, 'Tesla', 'Model 3', 2022, 'White', 'GHI-3456', '5YJ3E1EA3LF123456');

-- Insert sample services catalog
INSERT INTO services (name, description, default_price) VALUES
    ('Oil Change', 'Standard oil change with filter replacement', 49.99),
    ('Brake Pad Replacement', 'Replace front or rear brake pads', 199.99),
    ('Tire Rotation', 'Rotate all four tires', 29.99),
    ('Engine Diagnostic', 'Full engine diagnostic scan', 89.99),
    ('Battery Replacement', 'Replace car battery', 150.00),
    ('Air Filter Replacement', 'Replace engine air filter', 39.99),
    ('Transmission Service', 'Transmission fluid change and inspection', 179.99),
    ('Wheel Alignment', 'Four-wheel alignment service', 99.99);

-- Insert sample orders
INSERT INTO orders (client_id, car_id, is_paid, is_archived) VALUES
    (1, 1, true, false),
    (2, 3, false, false),
    (3, 4, true, false);

-- Insert sample order items
INSERT INTO order_items (order_id, service_name, description, quantity, unit_price, labor_cost, parts_cost) VALUES
    (1, 'Oil Change', 'Full synthetic oil', 1, 49.99, 30.00, 25.00),
    (1, 'Tire Rotation', 'Standard rotation', 1, 29.99, 29.99, 0.00),
    (2, 'Brake Pad Replacement', 'Front brake pads', 1, 199.99, 100.00, 120.00),
    (3, 'Battery Replacement', 'Premium battery', 1, 150.00, 30.00, 80.00);

-- Insert sample daily logs
INSERT INTO daily_logs (log_date, description, staff_email) VALUES
    (CURRENT_DATE, 'Opened shop, performed morning inspection of equipment', 'staff@autoservice.com'),
    (CURRENT_DATE - INTERVAL '1 day', 'Completed 5 oil changes and 2 brake jobs', 'staff@autoservice.com');

-- ============================================
-- VIEWS FOR REPORTING (Optional)
-- ============================================

-- View for order totals with profit calculation
CREATE OR REPLACE VIEW order_financials AS
SELECT 
    o.id,
    o.client_id,
    o.car_id,
    c.full_name as client_name,
    car.make || ' ' || car.model as vehicle,
    COALESCE(SUM(oi.quantity * oi.unit_price), 0) as total_revenue,
    COALESCE(SUM(oi.labor_cost), 0) as total_labor_cost,
    COALESCE(SUM(oi.parts_cost), 0) as total_parts_cost,
    COALESCE(SUM(oi.quantity * oi.unit_price) - SUM(oi.parts_cost), 0) as net_profit,
    o.is_paid,
    o.is_archived,
    o.created_at
FROM orders o
JOIN clients c ON o.client_id = c.id
JOIN cars car ON o.car_id = car.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, c.full_name, car.make, car.model;

-- Grant access to the view
GRANT SELECT ON order_financials TO authenticated;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'AutoService Pro database schema created successfully!';
    RAISE NOTICE 'Tables created: clients, cars, orders, daily_logs';
    RAISE NOTICE 'Sample data inserted for testing';
    RAISE NOTICE 'Row Level Security enabled with policies';
END $$;
