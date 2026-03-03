-- Migration: Add slug column and year column to give table
-- This migration adds slug-based routing and year tracking to the give/donations system

-- Step 1: Add the slug column if it doesn't exist
ALTER TABLE give
ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;

-- Step 2: Add the year column if it doesn't exist
ALTER TABLE give
ADD COLUMN IF NOT EXISTS year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE);

-- Step 3: Generate slugs for existing records using the title
-- This uses a simple lowercase + hyphen approach
UPDATE give
SET slug = LOWER(
  TRIM(
    REGEXP_REPLACE(REGEXP_REPLACE(title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')
  )
)
WHERE slug IS NULL;

-- Step 4: Ensure slug column is NOT NULL (after populating it)
ALTER TABLE give
ALTER COLUMN slug SET NOT NULL;

-- Verification query - run this to check the results
-- SELECT id, title, slug, year FROM give;
