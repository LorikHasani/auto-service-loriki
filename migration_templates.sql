-- Invoice Templates Table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS invoice_templates (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    company_slogan VARCHAR(255),
    company_address TEXT,
    company_phone VARCHAR(100),
    invoice_footer_message TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE invoice_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage templates"
    ON invoice_templates FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
