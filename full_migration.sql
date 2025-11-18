-- Facilities table
CREATE TABLE IF NOT EXISTS facilities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  address TEXT,
  phone TEXT,
  website TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_facilities_category ON facilities(category);
CREATE INDEX IF NOT EXISTS idx_facilities_location ON facilities(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_facilities_created_at ON facilities(created_at);
-- Add image_url column to facilities table
ALTER TABLE facilities ADD COLUMN image_url TEXT;
-- Make latitude and longitude optional (allow NULL)
-- SQLite doesn't support ALTER COLUMN, so we need to recreate the table

-- Step 1: Create new table with optional coordinates
CREATE TABLE facilities_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  latitude REAL,
  longitude REAL,
  address TEXT,
  phone TEXT,
  website TEXT,
  image_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Copy data from old table
INSERT INTO facilities_new (id, name, description, category, latitude, longitude, address, phone, website, image_url, created_at, updated_at)
SELECT id, name, description, category, latitude, longitude, address, phone, website, image_url, created_at, updated_at
FROM facilities;

-- Step 3: Drop old table
DROP TABLE facilities;

-- Step 4: Rename new table
ALTER TABLE facilities_new RENAME TO facilities;

-- Step 5: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_facilities_category ON facilities(category);
CREATE INDEX IF NOT EXISTS idx_facilities_location ON facilities(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_facilities_created_at ON facilities(created_at);
-- Convert facilities table to hospitals table with medical-specific fields
-- SQLite doesn't support ALTER COLUMN, so we need to recreate the table

-- Step 1: Create new hospitals table
CREATE TABLE IF NOT EXISTS hospitals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  departments TEXT,  -- 診療科目（カンマ区切り）
  latitude REAL,
  longitude REAL,
  address TEXT,
  phone TEXT,
  website TEXT,
  image_url TEXT,
  business_hours TEXT,  -- 診療時間
  closed_days TEXT,     -- 休診日
  parking TEXT,         -- 駐車場情報
  emergency BOOLEAN DEFAULT 0,  -- 救急対応
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Copy data from facilities (if exists)
INSERT INTO hospitals (id, name, description, departments, latitude, longitude, address, phone, website, image_url, created_at, updated_at)
SELECT id, name, description, category, latitude, longitude, address, phone, website, image_url, created_at, updated_at
FROM facilities;

-- Step 3: Drop old facilities table
DROP TABLE IF EXISTS facilities;

-- Step 4: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_hospitals_departments ON hospitals(departments);
CREATE INDEX IF NOT EXISTS idx_hospitals_location ON hospitals(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_hospitals_created_at ON hospitals(created_at);
CREATE INDEX IF NOT EXISTS idx_hospitals_emergency ON hospitals(emergency);
-- Add medical imaging modality fields and remote reading fields
-- Remove time-based and parking fields
-- SQLite doesn't support DROP COLUMN directly, so we need to recreate the table

-- Step 1: Create new hospitals table with modality fields
CREATE TABLE IF NOT EXISTS hospitals_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  departments TEXT,  -- 診療科目（カンマ区切り）
  latitude REAL,
  longitude REAL,
  address TEXT,
  phone TEXT,
  website TEXT,
  image_url TEXT,
  -- Removed: business_hours, closed_days, parking
  -- Added: modality fields
  has_ct BOOLEAN DEFAULT 0,  -- CTスキャン
  has_mri BOOLEAN DEFAULT 0,  -- MRI
  has_pet BOOLEAN DEFAULT 0,  -- PET
  has_remote_reading BOOLEAN DEFAULT 0,  -- 遠隔読影サービス
  remote_reading_provider TEXT,  -- 遠隔読影事業者
  emergency BOOLEAN DEFAULT 0,  -- 救急対応
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Copy existing data from old hospitals table
INSERT INTO hospitals_new (id, name, description, departments, latitude, longitude, 
                           address, phone, website, image_url, emergency, created_at, updated_at)
SELECT id, name, description, departments, latitude, longitude, 
       address, phone, website, image_url, emergency, created_at, updated_at
FROM hospitals;

-- Step 3: Drop old hospitals table
DROP TABLE hospitals;

-- Step 4: Rename new table to hospitals
ALTER TABLE hospitals_new RENAME TO hospitals;

-- Step 5: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_hospitals_departments ON hospitals(departments);
CREATE INDEX IF NOT EXISTS idx_hospitals_location ON hospitals(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_hospitals_created_at ON hospitals(created_at);
CREATE INDEX IF NOT EXISTS idx_hospitals_emergency ON hospitals(emergency);
CREATE INDEX IF NOT EXISTS idx_hospitals_has_ct ON hospitals(has_ct);
CREATE INDEX IF NOT EXISTS idx_hospitals_has_mri ON hospitals(has_mri);
CREATE INDEX IF NOT EXISTS idx_hospitals_has_pet ON hospitals(has_pet);
CREATE INDEX IF NOT EXISTS idx_hospitals_has_remote_reading ON hospitals(has_remote_reading);
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
