/*
  # Add Events Columns Migration

  1. New Columns Added
    - `title` (text) - Event title/name
    - `date` (date) - Event date
    - `time` (time) - Event start time
    - `venue` (text) - Venue name
    - `organizer` (text) - Event organizer
    - `description` (text) - Event description
    - `category` (text) - Event category (Rock, Electronic, Jazz, etc.)
    - `image` (text) - Image URL/path reference
    - `location` (text) - Event location/city
    - `price` (text) - Event pricing information

  2. Constraints
    - Set NOT NULL constraints on essential fields
    - Add default values where appropriate

  3. Indexes
    - Add indexes for frequently queried columns

  4. Security
    - Maintain existing RLS settings
*/

-- Add new columns to the existing table
ALTER TABLE "groovanna b" 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS date DATE,
ADD COLUMN IF NOT EXISTS time TIME,
ADD COLUMN IF NOT EXISTS venue TEXT,
ADD COLUMN IF NOT EXISTS organizer TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General',
ADD COLUMN IF NOT EXISTS image TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS price TEXT;

-- Set NOT NULL constraints on essential fields
DO $$
BEGIN
  -- Only add constraints if columns exist and don't already have NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'groovanna b' AND column_name = 'title' AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE "groovanna b" ALTER COLUMN title SET NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'groovanna b' AND column_name = 'date' AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE "groovanna b" ALTER COLUMN date SET NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'groovanna b' AND column_name = 'venue' AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE "groovanna b" ALTER COLUMN venue SET NOT NULL;
  END IF;
END $$;

-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_groovanna_b_date ON "groovanna b" (date);
CREATE INDEX IF NOT EXISTS idx_groovanna_b_category ON "groovanna b" (category);
CREATE INDEX IF NOT EXISTS idx_groovanna_b_location ON "groovanna b" (location);

-- Add a comment to clarify the table purpose
COMMENT ON TABLE "groovanna b" IS 'Events listings with comprehensive event information';