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
