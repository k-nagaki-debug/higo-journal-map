-- Add system type fields to hospitals table
ALTER TABLE hospitals ADD COLUMN has_onpremise BOOLEAN DEFAULT 0;
ALTER TABLE hospitals ADD COLUMN has_cloud BOOLEAN DEFAULT 0;
ALTER TABLE hospitals ADD COLUMN has_ichigo BOOLEAN DEFAULT 0;
