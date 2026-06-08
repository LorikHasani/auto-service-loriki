-- AutoService Pro — Appointments (Terminet)
-- Run this in your Supabase SQL Editor

-- ============================================
-- APPOINTMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS appointments (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL,
    car_id BIGINT REFERENCES cars(id) ON DELETE SET NULL,
    customer_name VARCHAR(255),
    phone VARCHAR(50),
    vehicle_info VARCHAR(255),
    appointment_date DATE NOT NULL,
    appointment_time TIME,
    service_description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_client ON appointments(client_id);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON appointments
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON appointments
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON appointments
    FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete for authenticated users" ON appointments
    FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
