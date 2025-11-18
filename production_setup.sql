-- Y's READING Hospital Map - Production Database Setup
-- Complete schema for fresh database

-- Create hospitals table with all current fields
CREATE TABLE IF NOT EXISTS hospitals (
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_hospitals_departments ON hospitals(departments);
CREATE INDEX IF NOT EXISTS idx_hospitals_location ON hospitals(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_hospitals_created_at ON hospitals(created_at);
CREATE INDEX IF NOT EXISTS idx_hospitals_has_ct ON hospitals(has_ct);
CREATE INDEX IF NOT EXISTS idx_hospitals_has_mri ON hospitals(has_mri);
CREATE INDEX IF NOT EXISTS idx_hospitals_has_pet ON hospitals(has_pet);
CREATE INDEX IF NOT EXISTS idx_hospitals_has_remote_reading ON hospitals(has_remote_reading);

-- Insert sample data
INSERT OR IGNORE INTO hospitals (name, description, departments, latitude, longitude, address, phone, has_ct, has_mri, has_pet, has_remote_reading, remote_reading_provider) VALUES 
  ('東京総合病院', '総合診療を行う大規模病院。最新の医療設備を完備。', '内科,外科,小児科,整形外科,皮膚科', 35.6812, 139.7671, '東京都千代田区丸の内1-1-1', '03-1234-5678', 1, 1, 1, 1, 'ワイズ・リーディング'),
  ('港区クリニック', '地域密着型のクリニック。一般内科と小児科を診療。', '内科,小児科', 35.6586, 139.7454, '東京都港区芝公園4-2-8', '03-2345-6789', 0, 0, 0, 0, NULL),
  ('台東医療センター', '地域の中核病院。救急医療に対応。', '内科,外科,救急科,産婦人科', 35.7148, 139.7967, '東京都台東区浅草2-3-1', '03-3456-7890', 1, 1, 0, 1, '東京遠隔読影センター'),
  ('墨田区ファミリークリニック', '家族で通えるクリニック。予防接種も実施。', '内科,小児科,耳鼻科', 35.7101, 139.8107, '東京都墨田区押上1-1-2', '03-4567-8901', 0, 0, 0, 0, NULL),
  ('新宿総合医療センター', '新宿駅近くの総合病院。専門医が多数在籍。', '内科,外科,整形外科,眼科,耳鼻科,皮膚科', 35.6895, 139.7006, '東京都新宿区西新宿1-1-1', '03-5678-9012', 1, 1, 1, 1, 'ワイズ・リーディング'),
  ('品川メディカルセンター', 'ワイズ・リーディング提携病院。最新画像診断設備完備。', '内科,放射線科,整形外科', 35.6284, 139.7387, '東京都品川区大井1-1-1', '03-6789-0123', 1, 1, 1, 1, 'ワイズ・リーディング');
