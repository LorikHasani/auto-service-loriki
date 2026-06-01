-- AutoService Pro — Expenses & Salary Payments
-- Run this in your Supabase SQL Editor

-- ============================================
-- DAILY EXPENSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS daily_expenses (
    id BIGSERIAL PRIMARY KEY,
    expense_date DATE NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_expenses_date ON daily_expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_expenses_category ON daily_expenses(category);

ALTER TABLE daily_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON daily_expenses
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON daily_expenses
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON daily_expenses
    FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete for authenticated users" ON daily_expenses
    FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_daily_expenses_updated_at BEFORE UPDATE ON daily_expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SALARY PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS salary_payments (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_salary_payments_date ON salary_payments(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_salary_payments_employee ON salary_payments(employee_id);

ALTER TABLE salary_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON salary_payments
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON salary_payments
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON salary_payments
    FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete for authenticated users" ON salary_payments
    FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_salary_payments_updated_at BEFORE UPDATE ON salary_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
