-- Remove emergency field from hospitals table
-- This migration removes the emergency field as it's no longer needed

-- Create new table without emergency field
CREATE TABLE IF NOT EXISTS hospitals_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  departments TEXT,
  latitude REAL,
  longitude REAL,
  address TEXT,
  phone TEXT,
  website TEXT,
  image_url TEXT,
  has_ct BOOLEAN DEFAULT 0,
  has_mri BOOLEAN DEFAULT 0,
  has_pet BOOLEAN DEFAULT 0,
  has_remote_reading BOOLEAN DEFAULT 0,
  remote_reading_provider TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Copy data from old table (excluding emergency field)
INSERT INTO hospitals_new (
  id, name, description, departments, latitude, longitude, 
  address, phone, website, image_url,
  has_ct, has_mri, has_pet, has_remote_reading, remote_reading_provider,
  created_at, updated_at
)
SELECT 
  id, name, description, departments, latitude, longitude,
  address, phone, website, image_url,
  has_ct, has_mri, has_pet, has_remote_reading, remote_reading_provider,
  created_at, updated_at
FROM hospitals;

-- Drop old table
DROP TABLE hospitals;

-- Rename new table
ALTER TABLE hospitals_new RENAME TO hospitals;
